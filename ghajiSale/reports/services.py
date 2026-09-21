# def description_builder(report_type, query_row):

#     match report_type:

#         case "expense":
#             parts = [
#                 f"₦{query_row.amount}",
#                 query_row.category.title(),
#             ]

#             if query_row.description:
#                 parts.append(f"({query_row.description})")

#             return " • ".join(parts)

#         case "stock":
#             parts = [
#                 f"{query_row.quantity} × {query_row.product.name}",
#             ]

#             if query_row.adjustment_type:
#                 parts.append(query_row.adjustment_type.title())

#             if query_row.reason:
#                 parts.append(query_row.reason)

#             return " • ".join(parts)

#         case "cash":
#             parts = [
#                 f"₦{abs(query_row.difference)} {'Shortage' if query_row.difference < 0 else 'Excess'}"
#             ]

#             if query_row.reason:
#                 parts.append(query_row.reason)

#             return " • ".join(parts)

#         case "incident":
#             parts = [
#                 query_row.title,
#                 query_row.severity.title(),
#             ]

#             if query_row.description:
#                 parts.append(query_row.description)

#             return " • ".join(parts)

#         case _:
#             return ""

def description_builder(report_type, query_row):

    match report_type:

        case "expense":
            parts = [
                query_row.category.title(),
                f"₦{query_row.amount:,.2f}",
            ]

            if query_row.description:
                parts.append(f"Reason: {query_row.description}")

            return " • ".join(parts)
        case "stock":

            action = (
                "Added"
                if query_row.adjustment_type.lower() == "added"
                else "Removed"
            )

            parts = [
                f"{action} {query_row.quantity} × {query_row.product.name}"
            ]

            if query_row.reason:
                parts.append(f"Reason: {query_row.reason}")

            return " • ".join(parts)

        case "cash":
            parts = [
                f"₦{abs(query_row.difference)} {'Shortage' if query_row.difference < 0 else 'Excess'}"
            ]

            if query_row.reason:
                parts.append(query_row.reason)

            return " • ".join(parts)

        case "incident":

            parts = [
                f"{query_row.severity.title()} Priority",
                query_row.title,
            ]

            if query_row.description:
                parts.append(query_row.description)

            return " • ".join(parts)

        case _:
            return ""

def report_to_summary(report_type, obj):
    config = REPORT_CONFIG[report_type]
    return {
        "id": obj.id,
        "type": report_type,
        "title": config["title"],
        "summary": description_builder(report_type, obj),
        "time": obj.report.created_at.strftime("%I:%M %p"),
        "status": obj.report.status,
        "created_at": obj.report.created_at,
        "icon": config["icon"],
        "details": report_to_details(report_type, obj),
    }


def report_to_details(report_type, obj):
    if report_type == 'expense':
        return {'category': obj.category, 'amount': str(obj.amount), 'description': obj.description}
    if report_type == 'stock':
        return {'product_id': obj.product_id, 'product': obj.product.name, 'quantity': obj.quantity, 'reason': obj.reason}
    if report_type == 'cash':
        return {'expected': str(obj.expected), 'counted': str(obj.counted), 'reason': obj.reason}
    if report_type == 'incident':
        return {'title': obj.title, 'severity': obj.severity, 'description': obj.description}
    return {}

REPORT_CONFIG = {
    "expense": {
        "title": "Expense Report",
        "icon": "receipt",
    },
    "stock": {
        "title": "Stock Adjustment",
        "icon": "package",
    },
    "cash": {
        "title": "Cash Difference",
        "icon": "wallet",
    },
    "incident": {
        "title": "Incident Report",
        "icon": "triangle-alert",
    },
}


def log_activity(user, action, detail='', level='info'):
    from .models import ActivityLog
    ActivityLog.objects.create(
        user=user if user and user.is_authenticated else None,
        action=action,
        detail=detail,
    )


def create_notification(title, message, user=None, icon='bell', report=None, link=''):
    from .models import Notification
    Notification.objects.create(
        report=report,
        user=user if user and user.is_authenticated else None,
        title=title,
        message=message,
        icon=icon,
        link=link,
    )


