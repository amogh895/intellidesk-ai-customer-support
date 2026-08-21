/**
 * Mongoose Inspection Script for IntelliDesk MongoDB Collections
 * 
 * Usage:
 *   node check_mongodb.js
 */

const mongoose = require('mongoose');
try { require('dotenv').config(); } catch (e) {}

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/intellidesk_db';

// ─── 1. MOONGOSE SCHEMAS ───

// Call Records Document Schema
const CallRecordSchema = new mongoose.Schema({
  id: String,
  agentId: String,
  agentName: String,
  customerId: String,
  customerName: String,
  policyNumber: String,
  policyType: String,
  callType: String,
  scheduledTime: String,
  completedTime: String,
  duration: String,
  intent: String,
  status: String,
  notes: String
}, { timestamps: true });

// Agent Directory Audit Log Schema
const AgentDirectoryLogSchema = new mongoose.Schema({
  id: String,
  name: String,
  email: String,
  role: String,
  status: String,
  dateAdded: String,
  dateRemoved: String,
  actionBy: String,
  notes: String
}, { timestamps: true });

// Customer Profile Schema
const CustomerSchema = new mongoose.Schema({
  id: String,
  name: String,
  phone: String,
  email: String,
  policy_number: String,
  policy_type: String,
  status: String,
  premium: Number,
  outstanding_premium: Number,
  renewal_date: String,
  coverage_details: String,
  claims: Array,
  interactions: Array
}, { timestamps: true });

const CallRecord = mongoose.model('CallRecord', CallRecordSchema, 'call_records');
const AgentDirectoryLog = mongoose.model('AgentDirectoryLog', AgentDirectoryLogSchema, 'agent_directory_logs');
const Customer = mongoose.model('Customer', CustomerSchema, 'customers');

async function inspectMongoDB() {
  try {
    console.log(`Connecting to MongoDB at: ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB successfully!\n');

    console.log('====================================');
    console.log('📁 1. CALL RECORDS COLLECTION (call_records)');
    console.log('====================================');
    const callRecords = await CallRecord.find().sort({ createdAt: -1 }).limit(5);
    console.log(JSON.stringify(callRecords, null, 2));

    console.log('\n====================================');
    console.log('📁 2. AGENT DIRECTORY LOGS COLLECTION (agent_directory_logs)');
    console.log('====================================');
    const directoryLogs = await AgentDirectoryLog.find().sort({ createdAt: -1 }).limit(5);
    console.log(JSON.stringify(directoryLogs, null, 2));

    console.log('\n====================================');
    console.log('📁 3. CUSTOMER PROFILES COLLECTION (customers)');
    console.log('====================================');
    const customers = await Customer.find().limit(5);
    console.log(JSON.stringify(customers, null, 2));

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected cleanly.');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('\n💡 Tip: Ensure MongoDB service is running on 127.0.0.1:27017 or set MONGO_URI environment variable.');
  }
}

inspectMongoDB();
