fetch('http://localhost:3000/api/documents/8b579fd7-73f1-46ff-8bbb-e320f9414149/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ question: 'When must the setup be completed?' })
})
.then(r => r.json())
.then(async data => {
  const fs = await import('fs');
  fs.writeFileSync('rag_ask_result.json', JSON.stringify(data, null, 2));
  console.log("DONE");
})
.catch(console.error);
