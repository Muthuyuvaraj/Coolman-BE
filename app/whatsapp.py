"""Pushes new orders to the store owner's WhatsApp through the WhatsApp Cloud API."""

import json
import logging
import re
from typing import Any, Callable
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


def build_order_text(order: dict[str, Any], image_links: list[str | None] | None = None) -> str:
    links = image_links or []
    lines = [
        f"*New order {order['orderId']}*",
        f"Tracking: {order['trackingId']}",
        "",
        f"*Customer:* {order['customerName']}",
        f"*Phone:* {order['phone']}",
        *([f"*Email:* {order['customerEmail']}"] if order.get("customerEmail") else []),
        f"*Address:* {order['address']}",
        "",
        "*Items*",
    ]
    for index, item in enumerate(order["items"], start=1):
        lines.append(f"{index}. {item['name']}")
        lines.append(f"   Size {item['size']} × {item['quantity']} = {format_price(item['price'] * item['quantity'])}")
        if index <= len(links) and links[index - 1]:
            lines.append(f"   Photo: {links[index - 1]}")
        if item.get("artworkUrl"):
            lines.append(f"   Customer's picture: {item['artworkUrl']}")
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


def photo_caption(index: int, item: dict[str, Any]) -> str:
    return f"{index}. {item['name']} — Size {item['size']} × {item['quantity']}"


class WhatsAppNotifier:
    def __init__(self, token: str, phone_number_id: str, template: str = "", template_language: str = "en") -> None:
        self.token = token
        self.phone_number_id = phone_number_id
        self.template = template
        self.template_language = template_language

    @property
    def configured(self) -> bool:
        return bool(self.token and self.phone_number_id)

    def _send(self, payload: dict[str, Any]) -> dict[str, Any]:
        request = Request(
            f"{GRAPH_API_URL}/{self.phone_number_id}/messages",
            data=json.dumps({"messaging_product": "whatsapp", **payload}).encode(),
            headers={"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"},
            method="POST",
        )
        with urlopen(request, timeout=20) as response:
            return json.loads(response.read() or b"{}")

    def _attempt(self, what: str, order_id: str, action: Callable[[], Any]) -> Any:
        """Runs one API step; failures are logged and swallowed so the remaining messages still go out."""
        try:
            return action()
        except HTTPError as error:
            logger.error("WhatsApp %s for %s failed: %s %s", what, order_id, error.code, error.read().decode(errors="replace"))
        except (URLError, TimeoutError, ValueError) as error:
            logger.error("WhatsApp %s for %s failed: %s", what, order_id, error)
        return None

    def notify_new_order(self, order: dict[str, Any], owner_phone: str | None, image_links: list[str | None]) -> None:
        """Runs after the response is sent; failures are logged, never raised, so they can't affect the order.

        image_links holds one public JPEG/PNG URL (or None) per order item. WhatsApp downloads each photo from
        that link itself, so it must be reachable from the internet.
        """
        order_id = order.get("orderId", "")
        if not self.configured:
            logger.warning("WhatsApp order alert skipped for %s: WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID not set.", order_id)
            return
        to = to_whatsapp_number(owner_phone)
        if not to:
            logger.warning("WhatsApp order alert skipped for %s: no owner phone number configured.", order_id)
            return
        photos = [(link, photo_caption(index, item)) for index, (item, link) in enumerate(zip(order["items"], image_links), start=1) if link]
        artwork = [(item["artworkUrl"], f"{index}. Customer's uploaded picture") for index, item in enumerate(order["items"], start=1) if item.get("artworkUrl")]
        if len(photos) < len(order["items"]):
            logger.warning("WhatsApp alert for %s: %d item(s) have no public photo link.", order_id, len(order["items"]) - len(photos))
        if self.template:
            # Business-initiated messages outside WhatsApp's 24-hour chat window must use an approved template.
            components: list[dict[str, Any]] = []
            if photos:
                components.append({"type": "header", "parameters": [{"type": "image", "image": {"link": photos[0][0]}}]})
            components.append({"type": "body", "parameters": [{"type": "text", "text": build_order_summary(order)}]})
            template = {"name": self.template, "language": {"code": self.template_language}, "components": components}
            if self._attempt("template alert", order_id, lambda: self._send({"to": to, "type": "template", "template": template})) is None:
                return
            photos = photos[1:]
        for link, caption in photos + artwork:
            self._attempt("photo message", order_id, lambda: self._send({"to": to, "type": "image", "image": {"link": link, "caption": caption}}))
        text = build_order_text(order, image_links)
        sent = self._attempt("order text", order_id, lambda: self._send({"to": to, "type": "text", "text": {"body": text, "preview_url": True}}))
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
