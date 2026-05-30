import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import SearchPage from './pages/SearchPage';
import ResultsPage from './pages/ResultsPage';
import SavedSearchesPage from './pages/SavedSearchesPage';
import DashboardPage from './pages/DashboardPage';

export default function App(){
 return (<BrowserRouter><Routes><Route element={<Layout/>}><Route path='/' element={<LandingPage/>}/><Route path='/search' element={<SearchPage/>}/><Route path='/results' element={<ResultsPage/>}/><Route path='/saved-searches' element={<SavedSearchesPage/>}/><Route path='/dashboard' element={<DashboardPage/>}/></Route></Routes></BrowserRouter>)
}
