const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');
const DepartmentController = require('../controllers/departmentController');
const EnergyMonthlyController = require('../controllers/energyMonthlyController');
const EnergyTypeController = require('../controllers/energyTypeController');
const AnomalyController = require('../controllers/anomalyController');
const SuggestionController = require('../controllers/suggestionController');
const ScenarioController = require('../controllers/scenarioController');
const ReportController = require('../controllers/reportController');
const WhatToDoController = require('../controllers/whatToDoController');

// Ana sayfa - Dashboard
router.get('/', DashboardController.getDashboard);
router.get('/api/dashboard', DashboardController.getDashboardAPI);

// Görsel sayfalar
router.get('/departments', DepartmentController.getPage);
router.get('/what-to-do', WhatToDoController.getPage);
router.get('/anomalies', AnomalyController.getPage);
router.get('/suggestions', SuggestionController.getPage);
router.get('/scenarios', ScenarioController.getPage);

// Departman routes
router.get('/api/departments', DepartmentController.getAll);
router.get('/api/departments/:id', DepartmentController.getById);
router.post('/api/departments', DepartmentController.create);
router.put('/api/departments/:id', DepartmentController.update);
router.post('/api/departments/:id/toggle-active', DepartmentController.toggleActive);
router.delete('/api/departments/:id', DepartmentController.delete);

// Enerji Aylık routes
router.get('/api/energy-monthly', EnergyMonthlyController.getAll);
router.get('/api/energy-monthly/:id', EnergyMonthlyController.getById);
router.post('/api/energy-monthly', EnergyMonthlyController.create);

// Enerji Türü routes
router.get('/api/energy-types', EnergyTypeController.getAll);
router.get('/api/energy-types/:id', EnergyTypeController.getById);

// Anormallik routes
router.get('/api/anomalies', AnomalyController.getAll);
router.get('/api/anomalies/:id', AnomalyController.getById);
router.get('/api/anomalies/level/:level', AnomalyController.getByLevel);

// Öneri routes
router.get('/api/suggestions', SuggestionController.getAll);
router.get('/api/suggestions/:id', SuggestionController.getById);
router.get('/api/suggestions/department/:departmentId', SuggestionController.getByDepartment);
router.put('/api/suggestions/:id', SuggestionController.update);

// Senaryo routes
router.get('/api/scenarios', ScenarioController.getAll);
router.get('/api/scenarios/:id', ScenarioController.getById);
router.post('/api/scenarios', ScenarioController.create);
router.put('/api/scenarios/:id', ScenarioController.update);
router.delete('/api/scenarios/:id', ScenarioController.delete);
router.post('/api/scenarios/compare', ScenarioController.compare);
router.post('/api/scenarios/apply', ScenarioController.apply);

// Rapor routes
router.get('/api/reports/scenario-pdf', ReportController.generateScenarioPDF);

module.exports = router;

