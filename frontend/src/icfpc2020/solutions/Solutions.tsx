import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import {makeStyles} from '@material-ui/core/styles';
import {StyledTableCell, StyledTableRow} from '../components/styledComponents';

export interface Solution {
    id: string;
    taskId: string;
    solver: string;
    score: number;
}

interface Props {
    solutions: Solution[];
}

const useStyles = makeStyles({ table: {}});

const Solutions = (props:Props) => {
    const { solutions } = props;
    const classes = useStyles();

    return (
        <TableContainer>
            <Table className={classes.table}>
                <TableHead>
                    <StyledTableRow>
                        <StyledTableCell>Task ID</StyledTableCell>
                        <StyledTableCell>Solution ID</StyledTableCell>
                        <StyledTableCell>Solver</StyledTableCell>
                        <StyledTableCell>Score</StyledTableCell>
                        <StyledTableCell>Download Solution</StyledTableCell>
                    </StyledTableRow>
                </TableHead>
                <TableBody>
                    {solutions.map((solution, i) =>
                        <StyledTableRow key={i}>
                            <StyledTableCell>{solution.taskId}</StyledTableCell>
                            <StyledTableCell>{solution.id}</StyledTableCell>
                            <StyledTableCell>{solution.solver}</StyledTableCell>
                            <StyledTableCell>{solution.score || '-'}</StyledTableCell>
                            <StyledTableCell> - </StyledTableCell>
                        </StyledTableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default Solutions;