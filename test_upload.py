import requests
import json

pdf_content = b'''%PDF-1.4
1 0 obj <</Type/Catalog/Pages 2 0 R>> endobj
2 0 obj <</Type/Pages/Count 1/Kids[3 0 R]>> endobj
3 0 obj <</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>/Contents 4 0 R>> endobj
4 0 obj <</Length 41>> stream
BT /F1 12 Tf 0 0 Td (This is a test document) Tj ET
endstream endobj
xref 0 5 0000000000 65535 f
0000000009 00000 n
0000000052 00000 n
0000000101 00000 n
0000000194 00000 n
trailer <</Size 5/Root 1 0 R>> startxref 285 %%EOF'''

with open('test_upload.pdf', 'wb') as f:
    f.write(pdf_content)

url = 'http://localhost:3000/api/documents/upload'
files = {'pdf': ('test_upload.pdf', open('test_upload.pdf', 'rb'), 'application/pdf')}
response = requests.post(url, files=files)
print(json.dumps(response.json(), indent=2))
