from django import template
from django.utils import timezone

register = template.Library()

@register.filter
def short_time_ago(value):
    if not value:
        return ""

    delta = timezone.now() - value
    seconds = int(delta.total_seconds())

    if seconds < 60:
        return "Just now"

    minutes = seconds // 60
    if minutes < 60:
        return f"{minutes}m ago"

    hours = minutes // 60
    if hours < 24:
        return f"{hours}h ago"

    days = hours // 24
    return f"{days}d ago"