async function runTests() {
    const API_BASE = 'http://localhost:3000/api';

    try {
        // 1. Health checks
        const health = await fetch(`${API_BASE}/health`).then(r => r.json());
        console.log('Backend Health:', health);

        // Check if we can reach document list
        const docs = await fetch(`${API_BASE}/documents`).then(r => r.json());
        console.log('Documents fetch:', docs.success, Array.isArray(docs.data));

    } catch (err) {
        console.error('Test Failed:', err.message);
    }
}
runTests();
