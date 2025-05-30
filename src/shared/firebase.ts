import admin, { ServiceAccount } from 'firebase-admin';
import { serviceAccount } from './serviceAccount';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
});

export default admin;
