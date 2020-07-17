import React, {useState} from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import {makeStyles, Theme} from '@material-ui/core/styles';
import DeleteIcon from '@material-ui/icons/Delete';
import {StyledTableCell, StyledTableRow} from '../components/styledComponents';
import {Solution} from './Solutions';
import {Button, TextField} from '@material-ui/core';

export type SolutionMap = { [id: number]: Solution };
export interface ColumnProps {
    id: number;
    query: string;
    solutions: { [id: number]: Solution };
    onQueryChange: (value: string) => void;
    onRefresh: () => void;
    onDelete: () => void;
    loading: boolean;
}

interface Props {
    columns: ColumnProps[];
    start: number;
    end: number;
}

const useStyles = makeStyles({
    table: {
        th: {
            'min-width': '160px',
        },
    },
});

const ColumnSearchBox = (props: ColumnProps) => {
    const { query, onQueryChange, loading, onRefresh, onDelete } = props;
    const [touched, setTouched] = useState(false);
    return (
        <StyledTableCell>
            <TextField
                value={query}
                onChange={(e) => {
                    onQueryChange(e.target.value);
                    setTouched(true);
                }}
                onBlur={(e) => {
                    if (touched) {
                        onRefresh();
                    }
                    setTouched(false);
                }}
                onKeyUp={(e) => {
                    if (e.key === 'Enter') {
                        onRefresh();
                    }
                }}
                disabled={loading}
            />
            <Button onClick={onDelete}>
                <DeleteIcon/>
            </Button>
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
                        {columns.map((column) => <ColumnSearchBox key={column.id} {...column} /> )}
                    </StyledTableRow>
                </TableHead>
                <TableBody>
                    {range(start, end).map((taskId) =>
                        <StyledTableRow key={taskId}>
                            <StyledTableCell>{taskId}</StyledTableCell>
                            {columns.map((column) => <SolutionCell key={column.id} solution={column.solutions[taskId]}/>)}
                        </StyledTableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default CompareBoard;