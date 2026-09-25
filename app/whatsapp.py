"""Pushes new orders to the store owner's WhatsApp through the WhatsApp Cloud API."""

import json
import logging
import re
from typing import Any
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


def item_photos(order: dict[str, Any]) -> list[tuple[str, str]]:
    """(public image URL, caption) per item. WhatsApp downloads the image itself, so it must be publicly reachable."""
    photos = []
    for index, item in enumerate(order["items"], start=1):
        image = item.get("image") or ""
        if image.startswith(("http://", "https://")):
            photos.append((image, f"{index}. {item['name']} — Size {item['size']} × {item['quantity']}"))
    return photos


class WhatsAppNotifier:
    def __init__(self, token: str, phone_number_id: str, template: str = "", template_language: str = "en") -> None:
        self.token = token
        self.phone_number_id = phone_number_id
        self.template = template
        self.template_language = template_language

    @property
    def configured(self) -> bool:
        return bool(self.token and self.phone_number_id)

    def _send(self, payload: dict[str, Any]) -> None:
        request = Request(
            f"{GRAPH_API_URL}/{self.phone_number_id}/messages",
            data=json.dumps({"messaging_product": "whatsapp", **payload}).encode(),
            headers={"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"},
            method="POST",
        )
        with urlopen(request, timeout=20) as response:
            response.read()

    def notify_new_order(self, order: dict[str, Any], owner_phone: str | None) -> None:
        """Runs after the response is sent; failures are logged, never raised, so they can't affect the order."""
        if not self.configured:
            return
        to = to_whatsapp_number(owner_phone)
        if not to:
            logger.warning("WhatsApp order alert skipped for %s: no owner phone number configured.", order.get("orderId"))
            return
        photos = item_photos(order)
        try:
            if self.template:
                # Business-initiated messages outside WhatsApp's 24-hour chat window must use an approved template.
                components: list[dict[str, Any]] = []
                if photos:
                    components.append({"type": "header", "parameters": [{"type": "image", "image": {"link": photos[0][0]}}]})
                components.append({"type": "body", "parameters": [{"type": "text", "text": build_order_summary(order)}]})
                self._send(
                    {
                        "to": to,
                        "type": "template",
                        "template": {"name": self.template, "language": {"code": self.template_language}, "components": components},
                    }
                )
                return
            for link, caption in photos:
                self._send({"to": to, "type": "image", "image": {"link": link, "caption": caption}})
            self._send({"to": to, "type": "text", "text": {"body": build_order_text(order)}})
        except HTTPError as error:
            logger.error("WhatsApp order alert for %s failed: %s %s", order.get("orderId"), error.code, error.read().decode(errors="replace"))
        except (URLError, TimeoutError) as error:
            logger.error("WhatsApp order alert for %s failed: %s", order.get("orderId"), error)
