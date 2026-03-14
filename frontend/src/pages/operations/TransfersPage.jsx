import React from 'react';
import OperationsView from '../../components/operations/OperationsView.jsx';

const TransfersPage = () => (
  <OperationsView type="transfer" title="Internal Transfers" description="Move stock between warehouse locations" />
);

export default TransfersPage;
