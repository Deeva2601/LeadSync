/**
 * LeadSync – App.tsx
 * Root component. Just renders the LeadsScreen.
 * No navigation library needed for a single-screen PoC.
 */

import React from 'react';
import LeadsScreen from './src/screens/LeadsScreen';

const App = () => <LeadsScreen />;

export default App;
