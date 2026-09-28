const fs = require("fs");
let text = fs.readFileSync("src/components/finance/PaymentModal.tsx", "utf-8");

// 1. Add payPaidTo state
text = text.replace(
  "  const [attachments, setAttachments] = useState<FileAttachment[]>([]);",
  "  const [payPaidTo, setPayPaidTo] = useState('');\n  const [attachments, setAttachments] = useState<FileAttachment[]>([]);"
);

// 2. When a client is selected, auto-fill payPaidTo with client name; clear on deselect
text = text.replace(
  `<DropdownPicker label="Select Client (Optional)" options={clientOptions} selectedValue={payClientId} onSelect={(val) => { setPayClientId(val as string); setPayOrderId(''); }} />`,
  `<DropdownPicker label="Select Client (Optional)" options={clientOptions} selectedValue={payClientId} onSelect={(val) => {
              const clientName = clients.find(c => c.entityId === val)?.companyName || '';
              setPayClientId(val as string);
              setPayOrderId('');
              setPayPaidTo(clientName);
            }} />`
);

// 3. Show a "Paid By (Name)" text input only when NO client is selected
text = text.replace(
  `<Text style={styles.inputLabel}>Amount (`,
  `{!payClientId && (
            <>
              <Text style={styles.inputLabel}>Received From <Text style={{ color: '#EF4444' }}>*</Text></Text>
              <TextInput
                style={[styles.input, !payPaidTo && { borderColor: '#EF4444' }]}
                value={payPaidTo}
                onChangeText={setPayPaidTo}
                placeholder="e.g. John Doe / Walk-in Customer"
              />
            </>
          )}

          <Text style={styles.inputLabel}>Amount (`
);

// 4. Add validation for paidTo
text = text.replace(
  `    if (!payAmount) {
      AppAlertStatic.alert('Error', 'Please fill Amount');
      return;
    }`,
  `    if (!payPaidTo.trim()) {
      AppAlertStatic.alert('Validation', 'Please select a client or enter the name of who made the payment.');
      return;
    }
    if (!payAmount) {
      AppAlertStatic.alert('Error', 'Please fill Amount');
      return;
    }`
);

// 5. Pass paidTo in the payload
text = text.replace(
  `        mode: payMode,\n        remarks: payRemarks\n      };`,
  `        mode: payMode,\n        remarks: payRemarks,\n        paidTo: payPaidTo\n      };`
);

// 6. Reset payPaidTo on close
text = text.replace(
  `setPayAmount(''); setPayRef(''); setPayRemarks(''); setPayOrderId(''); setPayClientId(''); setAttachments([]);`,
  `setPayAmount(''); setPayRef(''); setPayRemarks(''); setPayOrderId(''); setPayClientId(''); setPayPaidTo(''); setAttachments([]);`
);

fs.writeFileSync("src/components/finance/PaymentModal.tsx", text, "utf-8");
console.log("PaymentModal updated");
