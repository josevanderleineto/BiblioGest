import { Router } from 'express';
import { authenticateToken, requirePasswordChangeCheck, requirePermission } from '../middlewares/auth';
import * as authCtrl from '../controllers/authController';
import * as userCtrl from '../controllers/userController';
import * as libCtrl from '../controllers/libraryController';
import * as catCtrl from '../controllers/catalogController';
import * as authRecordCtrl from '../controllers/authorityController';
import * as itemCtrl from '../controllers/itemController';
import * as circCtrl from '../controllers/circulationController';
import * as fineCtrl from '../controllers/fineController';
import * as serialCtrl from '../controllers/serialController';
import * as acqCtrl from '../controllers/acquisitionController';
import * as invCtrl from '../controllers/inventoryController';
import * as repCtrl from '../controllers/reportController';
import * as dbCtrl from '../controllers/databaseController';
import * as setupCtrl from '../controllers/setupController';
import * as settingsCtrl from '../controllers/settingsController';

const router = Router();

// Public Setup & Auth endpoints
router.get('/setup/status', setupCtrl.checkSystemSetupStatus);
router.post('/auth/login', authCtrl.login);
router.get('/opac/settings', settingsCtrl.getPublicLibraryIdentity);

// Public OPAC Catalog search endpoints
router.get('/opac/catalog', catCtrl.listCatalog);
router.get('/opac/catalog/:id', catCtrl.getCatalogById);

// Protected Routes (Authentication Required)
router.use(authenticateToken);
router.post('/auth/change-password', authCtrl.changePassword);
router.get('/auth/me', authCtrl.getMe);

// Check if mandatory password change is pending
router.use(requirePasswordChangeCheck);

// Users & RBAC
router.get('/users', requirePermission('users.view'), userCtrl.listUsers);
router.get('/users/:id', requirePermission('users.view'), userCtrl.getUserById);
router.post('/users', requirePermission('users.create'), userCtrl.createUser);
router.put('/users/:id', requirePermission('users.edit'), userCtrl.updateUser);
router.get('/roles', requirePermission('users.view'), userCtrl.listRoles);
router.get('/permissions', requirePermission('users.view'), userCtrl.listPermissions);

// Libraries
router.get('/libraries', libCtrl.listLibraries);
router.post('/libraries', requirePermission('settings.edit'), libCtrl.createLibrary);
router.put('/libraries/:id', requirePermission('settings.edit'), libCtrl.updateLibrary);
router.delete('/libraries/:id', requirePermission('settings.edit'), libCtrl.deleteLibrary);
router.get('/settings', requirePermission('settings.view'), settingsCtrl.getSettings);
router.put('/settings', requirePermission('settings.edit'), settingsCtrl.updateSettings);

// Cataloging (MARC21 / RDA / CDD)
router.get('/catalog', catCtrl.listCatalog);
router.get('/catalog/template/:materialType', catCtrl.getMarcTemplate);
router.get('/catalog/:id', catCtrl.getCatalogById);
router.post('/catalog', requirePermission('catalog.create'), catCtrl.createCatalogRecord);
router.put('/catalog/:id', requirePermission('catalog.edit'), catCtrl.updateCatalogRecord);
router.delete('/catalog/:id', requirePermission('catalog.delete'), catCtrl.deleteCatalogRecord);
router.get('/catalog/:id/export', catCtrl.exportCatalogRecord);

// Authorities
router.get('/authorities', authRecordCtrl.listAuthorities);
router.post('/authorities', requirePermission('catalog.create'), authRecordCtrl.createAuthority);

// Items (Exemplares)
router.get('/items', itemCtrl.listItems);
router.get('/items/barcode/:barcode', itemCtrl.getItemByBarcode);
router.get('/items/labels', requirePermission('catalog.view'), itemCtrl.getItemLabels);
router.post('/items', requirePermission('catalog.create'), itemCtrl.createItem);
router.put('/items/:id', requirePermission('catalog.edit'), itemCtrl.updateItem);

// Circulation
router.post('/circulation/checkout', requirePermission('circulation.checkout'), circCtrl.checkout);
router.post('/circulation/return', requirePermission('circulation.return'), circCtrl.returnItem);
router.post('/circulation/renew/:loanId', requirePermission('circulation.renew'), circCtrl.renewLoan);
router.get('/circulation/loans', circCtrl.listLoans);
router.post('/circulation/reservations', circCtrl.createReservation);
router.get('/circulation/reservations', circCtrl.listReservations);

// Fines
router.get('/fines', fineCtrl.listFines);
router.post('/fines/:id/pay', requirePermission('circulation.checkout'), fineCtrl.payFine);
router.post('/fines/:id/cancel', requirePermission('circulation.checkout'), fineCtrl.cancelFine);

// Serials
router.get('/serials', serialCtrl.listSerials);
router.post('/serials', requirePermission('catalog.create'), serialCtrl.createSerial);
router.post('/serials/issues', requirePermission('catalog.create'), serialCtrl.createIssue);

// Acquisitions & Disposals
router.get('/acquisitions', acqCtrl.listAcquisitions);
router.post('/acquisitions', requirePermission('catalog.create'), acqCtrl.createAcquisition);
router.get('/disposals', acqCtrl.listDisposals);
router.post('/disposals', requirePermission('catalog.edit'), acqCtrl.createDisposal);

// Inventory
router.post('/inventory/scan', invCtrl.scanInventoryItem);
router.get('/inventory/summary/:sessionId', invCtrl.getInventorySummary);

// Reports & Dashboard
router.get('/reports/dashboard', repCtrl.getDashboardStats);
router.get('/reports/overdue', requirePermission('reports.view'), repCtrl.getOverdueReport);

// Database Administration & Backup/Restore
router.post('/database/test-connection', requirePermission('settings.view'), dbCtrl.testDatabaseConnection);
router.get('/database/backup', requirePermission('database.backup'), dbCtrl.exportBackup);
router.post('/database/restore', requirePermission('database.restore'), dbCtrl.restoreBackup);
router.post('/database/import', requirePermission('database.import'), dbCtrl.importCollaborativeData);

export default router;
