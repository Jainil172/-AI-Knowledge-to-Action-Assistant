const fs = require('fs');
const path = require('path');

async function runTests() {
    const BASE_URL = 'http://localhost:3000/api';
    const salt = Date.now();
    let userA = { email: `usera_${salt}@example.com`, password: 'password123', name: 'User A' };
    let userB = { email: `userb_${salt}@example.com`, password: 'password123', name: 'User B' };
    let tokenA, tokenB;

    console.log('--- TEST 1: NEW USER SIGNUP ---');
    let res = await fetch(`${BASE_URL}/auth/signup`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userA)
    });
    let data = await res.json();
    if (data.success) {
        console.log('✅ Signup User A successful');
        tokenA = data.token;
    } else {
        console.log('❌ Signup failed', data);
        return;
    }

    // Dashboard check
    res = await fetch(`${BASE_URL}/documents`, {
        headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    data = await res.json();
    if (data.data && data.data.length === 0) {
        console.log('✅ Empty dashboard verified (0 docs)');
    } else {
        console.log('❌ Dashboard not empty', data);
    }

    console.log('--- TEST 2: LOGIN ---');
    res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userA.email, password: 'wrongpassword' })
    });
    if (res.status === 401) {
        console.log('✅ Invalid password creates 401');
    } else {
        console.log('❌ Invalid password gave status', res.status);
    }

    res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `fake_${salt}@ex.com`, password: 'abc' })
    });
    if (res.status === 401) {
        console.log('✅ Non-existing email creates 401');
    }

    console.log('--- TEST 3: PROTECTED ROUTES ---');
    res = await fetch(`${BASE_URL}/documents`);
    if (res.status === 401) {
        console.log('✅ Missing token rejected (401)');
    } else {
        console.log('❌ Missing token got status', res.status);
    }

    console.log('--- TEST 4: DOCUMENT OWNERSHIP ---');
    // Upload dummy PDF for User A
    fs.writeFileSync('dummy.pdf', 'Dummy PDF content for testing upload');
    const formData = new FormData();
    formData.append('pdf', new Blob([fs.readFileSync('dummy.pdf')]), 'dummy.pdf');

    res = await fetch(`${BASE_URL}/documents/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${tokenA}` },
        body: formData
    });

    // Usually this fails with 503 because it's a dummy PDF and AI rejects it, but we can check if it creates the doc, or we check the RAG endpoint
    data = await res.json();
    let documentIdA = null;
    if (data.success && data.document) {
        console.log('✅ Uploaded PDF for User A');
        documentIdA = data.document.id;
    } else {
        console.log('❌ Upload gave (possibly expected if AI rejects invalid PDF):', data.message);
    }

    // Signup User B
    res = await fetch(`${BASE_URL}/auth/signup`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userB)
    });
    tokenB = (await res.json()).token;

    if (documentIdA) {
        // Verify User B cannot see User A's document
        res = await fetch(`${BASE_URL}/documents/${documentIdA}`, {
            headers: { 'Authorization': `Bearer ${tokenB}` }
        });
        if (res.status === 404) {
            console.log(`✅ User B cannot access User A's document`);
        } else {
            console.log(`❌ User B accessed User A's document! Status: ${res.status}`);
        }

        console.log('--- TEST 5: RAG SECURITY ---');
        res = await fetch(`${BASE_URL}/rag/ask`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${tokenB}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentId: documentIdA, question: 'Hello?' })
        });
        if (res.status === 404) {
            console.log(`✅ User B cannot run RAG against User A's document (404)`);
        } else {
            console.log(`❌ RAG breach! User B queried User A's document. Status: ${res.status}`);
        }
    }

    console.log('Cleaning up...');
    if (fs.existsSync('dummy.pdf')) fs.unlinkSync('dummy.pdf');
}

runTests().catch(console.error);
