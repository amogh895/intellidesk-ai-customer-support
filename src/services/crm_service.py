from typing import Dict, Any, Optional

class CRMService:
    """
    Mock CRM service providing lookup of policyholders, active policies, and claim history.
    """
    def __init__(self):
        # Setup mock customer database with rich enterprise profile details
        self.db = {
            "CRM-101": {
                "id": "CRM-101",
                "name": "Alice Smith",
                "phone": "9876543210",
                "email": "alice.smith@northbridge.com",
                "policy_number": "POL-AUTO-501",
                "policy_type": "Auto",
                "status": "Active",
                "premium": 1200,
                "outstanding_premium": 0,
                "renewal_date": "2026-12-15",
                "risk_level": "Low",
                "preferred_language": "English",
                "coverage_details": "Liability, Collision (₹500 deductible), Comprehensive (₹250 deductible)",
                "claims": [
                    {"id": "CL-100234", "status": "Approved", "type": "Auto Comprehensive", "amount": 800}
                ],
                "interactions": [
                    {"date": "2026-05-10", "type": "📞 Call", "notes": "Inquired about premium payment methods."},
                    {"date": "2026-06-12", "type": "✉️ Email", "notes": "Sent auto claim document template."}
                ]
            },
            "CRM-102": {
                "id": "CRM-102",
                "name": "Bob Jones",
                "phone": "8765432109",
                "email": "bob.jones@gmail.com",
                "policy_number": "POL-HOME-902",
                "policy_type": "Home",
                "status": "Inactive",
                "premium": 1500,
                "outstanding_premium": 350,
                "renewal_date": "2026-10-05",
                "risk_level": "High (Lapsed)",
                "preferred_language": "English",
                "coverage_details": "Dwelling coverage 100% replacement cost, Standard water damage, ₹1,000 deductible",
                "claims": [],
                "interactions": [
                    {"date": "2026-04-01", "type": "📞 Call", "notes": "Requested home inspection schedule details."},
                    {"date": "2026-05-20", "type": "⚠️ Alert", "notes": "Policy lapsed notice sent due to non-payment."}
                ]
            },
            "CRM-103": {
                "id": "CRM-103",
                "name": "Charlie Davis",
                "phone": "7654321098",
                "email": "charlie.davis@yahoo.com",
                "policy_number": "POL-LIFE-303",
                "policy_type": "Life",
                "status": "Active",
                "premium": 800,
                "outstanding_premium": 0,
                "renewal_date": "2027-01-20",
                "risk_level": "Medium",
                "preferred_language": "Spanish",
                "coverage_details": "Term Life 20-Year (₹50,00,000 face value)",
                "claims": [],
                "interactions": [
                    {"date": "2026-06-01", "type": "📞 Call", "notes": "Nominee details updated."}
                ]
            },
            "CRM-104": {
                "id": "CRM-104",
                "name": "David Wilson",
                "phone": "6543210987",
                "email": "david.wilson@outlook.com",
                "policy_number": "POL-HOME-104",
                "policy_type": "Home",
                "status": "Active",
                "premium": 1800,
                "outstanding_premium": 0,
                "renewal_date": "2026-11-30",
                "risk_level": "Low",
                "preferred_language": "English",
                "coverage_details": "Dwelling coverage 100% replacement cost, Home Loan Insurance alignment active, Mortgagee: NorthBridge Funding, ₹1,000 deductible",
                "claims": [
                    {"id": "CL-200987", "status": "Pending", "type": "Water Pipe Burst", "amount": 3200}
                ],
                "interactions": [
                    {"date": "2026-07-20", "type": "📞 Call", "notes": "Reported water pipe leakage in basement."}
                ]
            }
        }

    def lookup_customer(self, identifier: str) -> Optional[Dict[str, Any]]:
        """
        Lookup customer details by CRM ID, Name, Phone, Email, or Policy Number (case insensitive).
        """
        val = identifier.strip().upper()
        if val in self.db:
            return self.db[val]
        
        # Search match across fields
        for customer in self.db.values():
            if (val.lower() in customer["name"].lower() or
                val in customer["phone"] or
                val.lower() in customer["email"].lower() or
                val in customer["policy_number"].upper()):
                return customer
                
        return None
