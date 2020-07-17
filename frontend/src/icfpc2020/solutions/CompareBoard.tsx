import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import {makeStyles, Theme} from '@material-ui/core/styles';
import {StyledTableCell, StyledTableRow} from '../components/styledComponents';
import {Solution} from './Solutions';
import {TextField} from '@material-ui/core';

export interface ColumnProps {
    query: string;
    solutions: { [id: number]: Solution };
    onQueryChange: (value: string) => void;
    onRefresh: () => void;
    loading: boolean;
}

interface Props {
    columns: ColumnProps[];
    start: number;
    end: number;
}

const useStyles = makeStyles({ table: {}});

const ColumnSearchBox = (props: ColumnProps) => {
    const { query, onQueryChange, loading } = props;
    return (
        <StyledTableCell>
            <TextField
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                disabled={loading}
            />
        </StyledTableCell>
    );
}

const SolutionCell = (props: { solution?: Solution }) => {
    const { solution } = props;
    if (!solution) {
        return null;
    }

    const {solver, score} = solution;

    return (
        <StyledTableCell>
            <div>{solver}</div>
            <div>{score}</div>
        </StyledTableCell>
    );
}

const range = (start: number, end: number) => {
    return Array(end - start + 1).fill(start).map((x, y) => x + y);
}

const CompareBoard = (props: Props) => {
    const { columns, start, end } = props;
    const classes = useStyles();

    return (
        <TableContainer>
            <Table className={classes.table}>
                <TableHead>
                    <StyledTableRow>
                        <StyledTableCell>Task ID</StyledTableCell>
                        {columns.map((column, i) => <ColumnSearchBox key={i} {...column} /> )}
                    </StyledTableRow>
                </TableHead>
                <TableBody>
                    {range(start, end).map((taskId) =>
                        <StyledTableRow key={taskId}>
                            <StyledTableCell>{taskId}</StyledTableCell>
                            {columns.map((column, i) => <SolutionCell key={i} solution={column.solutions[taskId]}/>)}
                        </StyledTableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default CompareBoard;