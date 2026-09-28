"""Pushes new orders to the store owner's WhatsApp through the WhatsApp Cloud API."""

import base64
import json
import logging
import re
from typing import Any, Callable
from uuid import uuid4
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

logger = logging.getLogger(__name__)

GRAPH_API_URL = "https://graph.facebook.com/v21.0"


def to_whatsapp_number(phone: str | None) -> str:
    """Country code + number, digits only. Bare 10-digit numbers are treated as Indian."""
    digits = re.sub(r"\D", "", phone or "")
    if len(digits) == 10:
        return f"91{digits}"
    if len(digits) == 11 and digits.startswith("0"):
        return f"91{digits[1:]}"
    return digits if len(digits) >= 11 else ""


def format_price(value: float) -> str:
    return f"₹{round(value):,}"


def build_order_text(order: dict[str, Any]) -> str:
    lines = [
        f"*New order {order['orderId']}*",
        f"Tracking: {order['trackingId']}",
        "",
        f"*Customer:* {order['customerName']}",
        f"*Phone:* {order['phone']}",
        f"*Email:* {order['customerEmail']}",
        f"*Address:* {order['address']}",
        "",
        "*Items*",
    ]
    for index, item in enumerate(order["items"], start=1):
        lines.append(f"{index}. {item['name']}")
        lines.append(f"   Size {item['size']} × {item['quantity']} = {format_price(item['price'] * item['quantity'])}")
    lines += ["", f"Subtotal: {format_price(order['subtotal'])}"]
    if order["discount"] > 0:
        coupon = f" ({order['couponCode']})" if order.get("couponCode") else ""
        lines.append(f"Discount{coupon}: -{format_price(order['discount'])}")
    lines.append(f"Delivery: {'FREE' if order['deliveryFee'] == 0 else format_price(order['deliveryFee'])}")
    lines.append(f"*Total: {format_price(order['total'])}*")
    lines.append(f"Payment: {order['paymentStatus']}")
    return "\n".join(lines)


def build_order_summary(order: dict[str, Any]) -> str:
    """One-line version for template variables, which WhatsApp rejects if they contain newlines."""
    items = ", ".join(f"{item['quantity']}× {item['name']} ({item['size']})" for item in order["items"])
    text = (
        f"{order['orderId']} | {order['customerName']}, {order['phone']}, {order['address']} | "
        f"{items} | Total {format_price(order['total'])} | Tracking {order['trackingId']}"
    )
    return re.sub(r"\s+", " ", text)


# WhatsApp image messages accept only JPEG and PNG.
SUPPORTED_IMAGE_TYPES = {"image/jpeg", "image/png"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024
CRLF = "\r\n"


def photo_caption(index: int, item: dict[str, Any]) -> str:
    return f"{index}. {item['name']} — Size {item['size']} × {item['quantity']}"


def load_image(source: str) -> tuple[bytes, str] | None:
    """(bytes, mime type) from a data URL or an http(s) URL; None when unreadable or unsupported."""
    if source.startswith("data:"):
        match = re.match(r"data:([\w/+.-]+);base64,(.*)", source, re.DOTALL)
        if not match:
            return None
        mime, data = match.group(1).lower(), base64.b64decode(match.group(2))
    elif source.startswith(("http://", "https://")):
        with urlopen(Request(source, headers={"User-Agent": "coolman-backend"}), timeout=20) as response:
            mime = response.headers.get_content_type().lower()
            data = response.read(MAX_IMAGE_BYTES + 1)
    else:
        return None
    if mime == "image/jpg":
        mime = "image/jpeg"
    if mime not in SUPPORTED_IMAGE_TYPES or len(data) > MAX_IMAGE_BYTES:
        return None
    return data, mime


class WhatsAppNotifier:
    def __init__(self, token: str, phone_number_id: str, template: str = "", template_language: str = "en") -> None:
        self.token = token
        self.phone_number_id = phone_number_id
        self.template = template
        self.template_language = template_language

    @property
    def configured(self) -> bool:
        return bool(self.token and self.phone_number_id)

    def _post(self, path: str, body: bytes, content_type: str) -> dict[str, Any]:
        request = Request(
            f"{GRAPH_API_URL}/{self.phone_number_id}/{path}",
            data=body,
            headers={"Authorization": f"Bearer {self.token}", "Content-Type": content_type},
            method="POST",
        )
        with urlopen(request, timeout=30) as response:
            return json.loads(response.read() or b"{}")

    def _send(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self._post("messages", json.dumps({"messaging_product": "whatsapp", **payload}).encode(), "application/json")

    def _upload(self, data: bytes, mime: str) -> str:
        """Uploads an image to WhatsApp and returns its media id, so photos never need a public URL."""
        boundary = uuid4().hex
        extension = "png" if mime == "image/png" else "jpg"
        fields = [("messaging_product", "whatsapp"), ("type", mime)]
        head = "".join(f'--{boundary}{CRLF}Content-Disposition: form-data; name="{name}"{CRLF}{CRLF}{value}{CRLF}' for name, value in fields)
        head += f'--{boundary}{CRLF}Content-Disposition: form-data; name="file"; filename="photo.{extension}"{CRLF}Content-Type: {mime}{CRLF}{CRLF}'
        body = head.encode() + data + f"{CRLF}--{boundary}--{CRLF}".encode()
        return self._post("media", body, f"multipart/form-data; boundary={boundary}")["id"]

    def _attempt(self, what: str, order_id: str, action: Callable[[], Any]) -> Any:
        """Runs one API step; failures are logged and swallowed so the remaining messages still go out."""
        try:
            return action()
        except HTTPError as error:
            logger.error("WhatsApp %s for %s failed: %s %s", what, order_id, error.code, error.read().decode(errors="replace"))
        except (URLError, TimeoutError, ValueError, KeyError) as error:
            logger.error("WhatsApp %s for %s failed: %s", what, order_id, error)
        return None

    def _photo_ids(self, order: dict[str, Any], image_sources: list[list[str]]) -> list[tuple[str, str]]:
        """(media id, caption) for every order item whose photo could be read and uploaded."""
        order_id = order.get("orderId", "")
        photos = []
        for index, (item, sources) in enumerate(zip(order["items"], image_sources), start=1):
            image = None
            for source in sources:
                image = self._attempt(f"photo read ({item['name']})", order_id, lambda: load_image(source))
                if image:
                    break
            if not image:
                logger.warning("WhatsApp alert for %s: no JPEG/PNG photo for %s, skipping it.", order_id, item["name"])
                continue
            media_id = self._attempt(f"photo upload ({item['name']})", order_id, lambda: self._upload(*image))
            if media_id:
                photos.append((media_id, photo_caption(index, item)))
        return photos

    def notify_new_order(self, order: dict[str, Any], owner_phone: str | None, image_sources: list[list[str]]) -> None:
        """Runs after the response is sent; failures are logged, never raised, so they can't affect the order.

        image_sources holds, per order item, candidate photos (data URLs or http(s) URLs); the first usable one is sent.
        """
        order_id = order.get("orderId", "")
        if not self.configured:
            logger.warning("WhatsApp order alert skipped for %s: WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID not set.", order_id)
            return
        to = to_whatsapp_number(owner_phone)
        if not to:
            logger.warning("WhatsApp order alert skipped for %s: no owner phone number configured.", order_id)
            return
        photos = self._photo_ids(order, image_sources)
        if self.template:
            # Business-initiated messages outside WhatsApp's 24-hour chat window must use an approved template.
            components: list[dict[str, Any]] = []
            if photos:
                components.append({"type": "header", "parameters": [{"type": "image", "image": {"id": photos[0][0]}}]})
            components.append({"type": "body", "parameters": [{"type": "text", "text": build_order_summary(order)}]})
            template = {"name": self.template, "language": {"code": self.template_language}, "components": components}
            if self._attempt("template alert", order_id, lambda: self._send({"to": to, "type": "template", "template": template})) is None:
                return
            photos = photos[1:]
        for media_id, caption in photos:
            self._attempt("photo message", order_id, lambda: self._send({"to": to, "type": "image", "image": {"id": media_id, "caption": caption}}))
        sent = self._attempt("order text", order_id, lambda: self._send({"to": to, "type": "text", "text": {"body": build_order_text(order)}}))
        if sent is not None:
            logger.info("WhatsApp order alert for %s sent to %s with %d photo(s).", order_id, to, len(photos))

    def diagnose(self, owner_phone: str | None) -> dict[str, Any]:
        """Sends Meta's built-in hello_world template and a plain text, returning Meta's raw reply for each.

        hello_world is exempt from the 24-hour window, so if it arrives but the text doesn't, the owner needs to
        message the business number first (or WHATSAPP_TEMPLATE must be set).
        """
        to = to_whatsapp_number(owner_phone)
        report: dict[str, Any] = {
            "tokenSet": bool(self.token),
            "phoneNumberIdSet": bool(self.phone_number_id),
            "to": to or None,
            "template": self.template or None,
        }
        if not self.configured or not to:
            return report

        def attempt(payload: dict[str, Any]) -> dict[str, Any]:
            try:
                return {"ok": True, "response": self._send({"to": to, **payload})}
            except HTTPError as error:
                body = error.read().decode(errors="replace")
                try:
                    return {"ok": False, "status": error.code, "error": json.loads(body).get("error", body)}
                except ValueError:
                    return {"ok": False, "status": error.code, "error": body}
            except (URLError, TimeoutError) as error:
                return {"ok": False, "error": str(error)}

        report["helloWorldTemplate"] = attempt({"type": "template", "template": {"name": "hello_world", "language": {"code": "en_US"}}})
        report["textMessage"] = attempt({"type": "text", "text": {"body": "Coolman test: order alerts are connected."}})
        return report
