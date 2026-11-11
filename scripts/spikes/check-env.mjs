// Says which settings are filled in. Never prints the values.
for (const k of ['FUNDER_CLIENT_ID','FUNDER_CLIENT_SECRET','SUPPLIER_EMAIL','BUYER_LARKSPUR_EMAIL','SUPPLIER_CLIENT_ID','SUPPLIER_CLIENT_SECRET','LARKSPUR_CLIENT_ID','LARKSPUR_CLIENT_SECRET','ANTHROPIC_API_KEY'])
  console.log(k.padEnd(24), process.env[k] ? `set (${process.env[k].length} chars)` : 'MISSING');
