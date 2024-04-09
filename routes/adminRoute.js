const express = require("express");
const admin_route = express();
const admincontroller = require('../controllers/admincontroller')
const adminModel = require('../models/adminModel'); 
const multer = require('multer');
admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin');


const {requireAdminAuth,checkAdmin} = require('../middlewear/authMiddleware');
admin_route.use(checkAdmin)


admin_route.get('/',admincontroller.adminlogin);

admin_route.post('/login-verify',admincontroller.verifyLogin);

admin_route.get('/dashboard',admincontroller.adminWelcome);


admin_route.get('/customers',requireAdminAuth,admincontroller.loadCustomers);

admin_route.post('/block/:userId', admincontroller.blockUser);
admin_route.post('/unblock/:userId', admincontroller.unblockUser);

admin_route.get('/adminout', admincontroller.adminLogout);

admin_route.get('/order',requireAdminAuth,admincontroller.loadUserOrder);

admin_route.get('/order-details',requireAdminAuth,admincontroller.loadUserOrderDetails);

admin_route.post('/orders/update-status',admincontroller.updateOrderStatus);

admin_route.post('/order-approve-reject',admincontroller.orderApproveOrReject);

admin_route.get('/salesReport',requireAdminAuth,admincontroller.loadSalesReport);

admin_route.get('/salesReportFilter',admincontroller.filterSalesReport);

module.exports = admin_route



