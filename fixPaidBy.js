const fs = require("fs");
let text = fs.readFileSync("src/components/finance/PaymentModal.tsx", "utf-8");

// Rename state variable
text = text.replace("const [payPaidTo, setPayPaidTo] = useState('');", "const [payPaidBy, setPayPaidBy] = useState('');");
text = text.replace(/payPaidTo/g, "payPaidBy");
text = text.replace(/setPayPaidTo/g, "setPayPaidBy");

// Rename in payload
text = text.replace("paidTo: payPaidBy", "paidBy: payPaidBy");

// Label rename
text = text.replace('"Received From"', '"Received From"'); // already correct label, just keep as-is

fs.writeFileSync("src/components/finance/PaymentModal.tsx", text, "utf-8");
console.log("Done");
