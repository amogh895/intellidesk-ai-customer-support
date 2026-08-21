import os
import json
from typing import Dict, Any, Optional, List

class CRMService:
    """
    Enterprise CRM Service providing customer identity verification,
    policyholder lookups, active coverage specs, claims history,
    and interaction audit trails. Supports both in-memory and MongoDB document store.
    """
    def __init__(self, collections_dir: Optional[str] = None):
        if collections_dir is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            self.collections_dir = os.path.join(base_dir, "mongodb_collections")
        else:
            self.collections_dir = collections_dir
            
        os.makedirs(self.collections_dir, exist_ok=True)
        self.customers_file = os.path.join(self.collections_dir, "customers.json")

        # Baseline enterprise customer profile database
        self.default_db = {
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
        
        self._sync_storage()

    def _sync_storage(self):
        """
        Synchronizes customer database with mongodb_collections/customers.json.
        """
        if not os.path.exists(self.customers_file):
            try:
                with open(self.customers_file, "w", encoding="utf-8") as f:
                    json.dump(list(self.default_db.values()), f, indent=2)
            except Exception:
                pass

    def get_all_customers(self) -> List[Dict[str, Any]]:
        """
        Returns all customer records from storage.
        """
        if os.path.exists(self.customers_file):
            try:
                with open(self.customers_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if data:
                        return data
            except Exception:
                pass
        return list(self.default_db.values())

    def lookup_customer(self, identifier: str) -> Optional[Dict[str, Any]]:
        """
        Robust lookup of customer details by CRM ID, Name, Phone, Email,
        or Policy Number (case-insensitive and trimmed).
        """
        if not identifier:
            return None
            
        clean = identifier.strip()
        clean_upper = clean.upper()
        clean_lower = clean.lower()
        clean_digits = "".join(filter(str.isdigit, clean))

        customers = self.get_all_customers()

        # 1. Exact ID match (e.g. CRM-101)
        for customer in customers:
            if customer.get("id", "").upper() == clean_upper:
                return customer

        # 2. Exact Policy Number match (e.g. POL-AUTO-501)
        for customer in customers:
            if customer.get("policy_number", "").upper() == clean_upper:
                return customer

        # 3. Exact Email or Phone match
        for customer in customers:
            if customer.get("email", "").lower() == clean_lower:
                return customer
            if clean_digits and "".join(filter(str.isdigit, customer.get("phone", ""))) == clean_digits:
                return customer

        # 4. Partial Name / Keyword search
        for customer in customers:
            cust_name = customer.get("name", "").lower()
            if clean_lower in cust_name or cust_name in clean_lower:
                return customer
            if clean_upper in customer.get("policy_number", "").upper():
                return customer
            if clean_lower in customer.get("email", "").lower():
                return customer

        return None

    def upsert_customer(self, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Insert or update a customer record in storage.
        """
        cid = customer_data.get("id")
        if not cid:
            cid = f"CRM-{len(self.get_all_customers()) + 101}"
            customer_data["id"] = cid

        customers = self.get_all_customers()
        updated = False
        for i, c in enumerate(customers):
            if c.get("id") == cid:
                customers[i] = {**c, **customer_data}
                updated = True
                break

        if not updated:
            customers.append(customer_data)

        try:
            with open(self.customers_file, "w", encoding="utf-8") as f:
                json.dump(customers, f, indent=2)
        except Exception:
            pass

        return customer_data
