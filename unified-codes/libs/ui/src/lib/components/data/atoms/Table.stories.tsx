import React from 'react';
import { Table } from './Table';

export default {
  component: Table,
  title: 'Table',
};

export const withNoProps = () => {
  return <Table />;
};
