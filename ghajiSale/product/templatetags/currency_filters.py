from django import template

register = template.Library()

@register.filter(name='currency')
def currency(value):
    try:
        # Formats the number with two decimals and comma separations
        return "₦{:,.2f}".format(value)
    except (ValueError, TypeError):
        return value
