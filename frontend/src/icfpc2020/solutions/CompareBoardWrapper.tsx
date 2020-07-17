import React, {useCallback, useContext, useEffect, useState} from 'react';
import Solutions, {Solution} from './Solutions';
import MessageContext, {MessageContextProps, withMessageContext} from '../contexts/MessageContext';
import {fetchSolutions, fetchSolutionsBySolver} from '../api';
import Pager from '../components/Pager';
import CompareBoard, {ColumnProps} from './CompareBoard';
import {useObservable} from 'rxjs-hooks';
import { map, distinctUntilChanged, switchMap, debounceTime, startWith, flatMap } from 'rxjs/operators';
import { Observable, Subject, Subscription } from 'rxjs';

interface State {
    columns: ColumnProps[];
    start: number,
    end: number,
}

const SOLVERS_KEY = 'icfpc2019.solvers';

const getOnQueryChange = (setState: (dispatch: (prevState: State) => State) => void, i: number) => {
    return (value: string) => {
        setState((prevState: State) => {
            const newColumns = prevState.columns.concat();
            newColumns[i].query = value;
            return {
                ...prevState,
                columns: newColumns,
            }
        });
    };
}

const getOnRefresh = (setState: (dispatch: (prevState: State) => State) => void, updateSolution: (i: number) => void, i: number) => {
    return () => {
        setState((prevState: State) => {
            const newColumns = prevState.columns.concat();
            newColumns[i].loading = true;
            return {
                ...prevState,
                columns: newColumns,
            }
        });
        updateSolution(i);
    };
}

const getNewColumn = (query: string, setState: (dispatch: (prevState: State) => State) => void, updateSolution: (i: number) => void, i: number): ColumnProps => {
    const onQueryChange = getOnQueryChange(setState, i);
    const onRefresh = getOnRefresh(setState, updateSolution, i);
    return {
        loading: true,
        query,
        solutions: {},
        onQueryChange,
        onRefresh,
    };
}

const makeSearchSubject = (s$: Subject<string>, query: string, initialState?: Solution[]): Observable<Solution[]> => {
    return s$
        .pipe(
            startWith(query),
            debounceTime(100),
            switchMap((query) => fetchSolutionsBySolver(query)),
            map((result) => result || []),
            startWith(initialState || []),
        );
}

class CompareBoardWrapper extends React.Component<MessageContextProps, State> {
    private subjects: Subject<string>[];
    private subscriptions: Subscription[];
    constructor(props: MessageContextProps) {
        super(props);
        this.state = {
            columns: [],
            start: 1,
            end: 20,
        };
        this.subjects = [];
        this.subscriptions = [];
    }

    componentDidMount() {
        const savedData = localStorage.getItem(SOLVERS_KEY);
        let queries: string[] = [''];
        if (savedData) {
            try {
                queries = JSON.parse(savedData);
            } catch (e) {
                localStorage.removeItem(SOLVERS_KEY);
            }
        }
        const columns = queries.map((q, i): ColumnProps => {
            return {
                query: q,
                onRefresh: () => { this.refreshColumn(i); },
                onQueryChange: (value) => { this.updateQuery(value, i); },
                loading: true,
                solutions: [],
            };
        });
        this.setState((prevState) => {
            return {
                ...prevState,
                columns,
            }
        }, () => {
            this.subjects = queries.map(() => new Subject<string>());
            this.subscriptions = this.subjects.map((s$, i) => {
                const column = columns[i];
                return s$.pipe(
                    startWith(column.query),
                    debounceTime(100),
                    flatMap((query) => fetchSolutionsBySolver(query)),
                    map((result) => result || []),
                ).subscribe({
                    next: (solutions) => this.setSolutions(solutions, i),
                    error: (err) => {
                        this.onFetchError(err, i);
                    },
                });
            });
        });
    }

    componentWillUnmount() {
        this.subscriptions.forEach((s$) => s$.unsubscribe());
    }

    refreshColumn = (index: number) => {
        const { query } = this.state.columns[index];
        this.setState((prevState) => {
            const newColumns = prevState.columns.concat();
            newColumns[index] = Object.assign({}, newColumns[index], { loading: true, });
            return {
                ...prevState,
                columns: newColumns,
            };
        }, () => { this.subjects[index].next(query); })
    }

    updateQuery = (query: string, index: number) => {
        this.setState((prevState) => {
            const newColumns = prevState.columns.concat();
            newColumns[index] = Object.assign({}, newColumns[index], { query });
            return {
                ...prevState,
                columns: newColumns,
            };
        });
    };

    setSolutions = (solutions: Solution[], index: number) => {
        this.setState((prevState) => {
            const newColumns = prevState.columns.concat();
            newColumns[index] = Object.assign({}, newColumns[index], { loading: false, solutions });
            return {
                ...prevState,
                columns: newColumns,
            };
        })
    };

    onFetchError = (error: string, index: number) => {
        this.setState((prevState) => {
            const newColumns = prevState.columns.concat();
            newColumns[index] = Object.assign({}, newColumns[index], { loading: false });
            return {
                ...prevState,
                columns: newColumns,
            };
        }, () => {
            this.props.sendMessage('error', error);
        })
    }

    render() {
        const { columns, start, end } = this.state;
        return (
            <React.Fragment>
                <CompareBoard columns={columns} start={start} end={end} />
            </React.Fragment>
        );
    }
}

export default withMessageContext(CompareBoardWrapper);
