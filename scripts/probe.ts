import {fetchProduct,DEMO_URL} from '../server/product';
import {writeFileSync} from 'node:fs';
const p=await fetchProduct(DEMO_URL);console.log({name:p.name,reviews:p.reviews.length,exact:p.reviews.filter(r=>r.scope==='exact').length,videos:p.videos,gaps:p.gaps});writeFileSync('examples/product-snapshot.json',JSON.stringify(p,null,2));
