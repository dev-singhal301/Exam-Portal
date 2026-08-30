import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import ExamScreen from './pages/ExamScreen';
import ResultScreen from './pages/ResultScreen';
import AdminDashboard from './pages/AdminDashboard';
import CreateExam from './pages/CreateExam';
import AdminSubmissions from './pages/AdminSubmissions';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exam/:id"
          element={
            <ProtectedRoute>
              <ExamScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/result/:id"
          element={
            <ProtectedRoute>
              <ResultScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/create"
          element={
            <ProtectedRoute requiredRole="admin">
              <CreateExam />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/submissions/:examId"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminSubmissions />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}