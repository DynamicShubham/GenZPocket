"""
Auto-categorization service for expense merchants.

Uses a keyword-based rules engine to assign a category based on the merchant name.
This runs synchronously (no I/O) for speed — call it inline on expense creation.
"""

from models import ExpenseCategory

# ─── Keyword → Category mapping ───────────────────────────────────────────────
# Keys are lowercase substrings to match against the merchant name.
_RULES: list[tuple[list[str], ExpenseCategory]] = [
    # Food & Dining
    (
        [
            "zomato", "swiggy", "dominos", "dominoes", "pizza", "burger", "kfc",
            "mcdonald", "mcdonalds", "subway", "starbucks", "cafe", "coffee",
            "restaurant", "food", "biryani", "diner", "eat", "kitchen",
            "bakery", "juice", "chai", "tea", "dhaba", "canteen", "mess",
        ],
        ExpenseCategory.FOOD,
    ),
    # Travel & Transport
    (
        [
            "uber", "ola", "rapido", "metro", "irctc", "railway", "bus", "train",
            "flight", "indigo", "spicejet", "air india", "makemytrip", "goibibo",
            "redbus", "petrol", "diesel", "fuel", "toll", "parking", "auto",
        ],
        ExpenseCategory.TRAVEL,
    ),
    # Shopping
    (
        [
            "amazon", "flipkart", "myntra", "ajio", "meesho", "nykaa", "mall",
            "store", "market", "shop", "mart", "retail", "fashion", "cloth",
            "decathlon", "croma", "reliance digital", "bigbasket", "blinkit",
            "zepto", "dunzo", "grocer",
        ],
        ExpenseCategory.SHOPPING,
    ),
    # Entertainment
    (
        [
            "netflix", "prime", "hotstar", "disney", "spotify", "youtube",
            "pvr", "inox", "bookmyshow", "game", "play", "theater", "cinema",
            "concert", "event", "gamer",
        ],
        ExpenseCategory.ENTERTAINMENT,
    ),
    # Subscriptions
    (
        [
            "subscription", "plan", "recharge", "airtel", "jio", "vi ",
            "notion", "canva", "figma", "github", "aws", "gcp", "azure",
            "adobe", "microsoft", "apple", "icloud",
        ],
        ExpenseCategory.SUBSCRIPTIONS,
    ),
    # Education
    (
        [
            "udemy", "coursera", "unacademy", "byjus", "byju", "physicswallah",
            "pw ", "edx", "books", "stationery", "pen", "notebook", "library",
            "college fee", "tuition", "course", "exam", "test series",
        ],
        ExpenseCategory.EDUCATION,
    ),
    # Health
    (
        [
            "pharmacy", "medical", "medicine", "apollo", "netmeds", "1mg",
            "hospital", "clinic", "doctor", "health", "gym", "cult.fit",
            "fitpass", "diagnostic", "lab test",
        ],
        ExpenseCategory.HEALTH,
    ),
    # Utilities
    (
        [
            "electricity", "water bill", "gas", "wifi", "internet", "broadband",
            "bsnl", "society", "maintenance",
        ],
        ExpenseCategory.UTILITIES,
    ),
    # Rent
    (
        [
            "rent", "hostel", "pg ", "paying guest", "accommodation",
        ],
        ExpenseCategory.RENT,
    ),
]


def auto_categorize(merchant: str) -> ExpenseCategory:
    """
    Returns the best-matching ExpenseCategory for a given merchant name.
    Falls back to OTHER if no rule matches.
    """
    merchant_lower = merchant.lower()
    for keywords, category in _RULES:
        for kw in keywords:
            if kw in merchant_lower:
                return category
    return ExpenseCategory.OTHER
