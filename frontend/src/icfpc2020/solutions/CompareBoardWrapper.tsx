import React from 'react';
import {Solution} from './Solutions';
import {MessageContextProps, withMessageContext} from '../contexts/MessageContext';
import {fetchSolutions, fetchSolutionsBySolver} from '../api';
import CompareBoard, {ColumnProps, SolutionMap} from './CompareBoard';
import { map, distinctUntilChanged, switchMap, debounceTime, startWith, flatMap } from 'rxjs/operators';
import { Observable, Subject, Subscription } from 'rxjs';
import {Button} from '@material-ui/core';

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

class CompareBoardWrapper extends React.Component<MessageContextProps, State> {
    private subjects: Subject<string>[];
    private subscriptions: Subscription[];
    private columnId: number;

    constructor(props: MessageContextProps) {
        super(props);
        this.state = {
            columns: [],
            start: 1,
            end: 20,
        };
        this.subjects = [];
        this.subscriptions = [];
        this.columnId = 0;
    }

    newColumn = (query: string, index: number, loading: boolean, solutions: SolutionMap = {}): ColumnProps => {
        this.columnId += 1;
        return {
            id: this.columnId,
            query,
            onRefresh: () => {
                this.refreshColumn(index);
            },
            onQueryChange: (value) => {
                this.updateQuery(value, index);
            },
            loading,
            solutions,
            onDelete: () => this.removeColumn(index),
        };
    };

    getSubscription = (s$: Subject<string>, index: number, query?: string, solutions?: SolutionMap): Subscription => {
        return s$.pipe(
            query !== undefined ? startWith(query) : map(q => q),
            debounceTime(100),
            flatMap((q: string) => fetchSolutionsBySolver(q)),
            map((result: Solution[]) => {
                const solutionMap: SolutionMap = {};
                result && result.map((s) => {
                    solutionMap[s.taskId] = s;
                });
                return solutionMap;
            }),
            solutions !== undefined ? startWith(solutions) : map(s => s),
        ).subscribe({
            next: (solutions) => this.setSolutions(solutions, index),
            error: (err) => {
                this.onFetchError(err, index);
            },
        });
    }

    componentDidMount() {
        const savedData = localStorage.getItem(SOLVERS_KEY);
        let queries: string[] = [''];
        if (savedData) {
            try {
                queries = JSON.parse(savedData);
                if (queries.length === 0) {
                    queries.push('');
                }
            } catch (e) {
                localStorage.removeItem(SOLVERS_KEY);
            }
        }
        const columns = queries.map((q, i) => this.newColumn(q, i, false));
        this.setState((prevState) => {
            return {
                ...prevState,
                columns,
            }
        }, () => {
            this.subjects = queries.map(() => new Subject<string>());
            this.subscriptions = this.subjects.map((s$, i) => {
                const column = columns[i];
                return this.getSubscription(s$, i, column.query);
            });
        });
    }

    componentDidUpdate(prevProps: Readonly<MessageContextProps>, prevState: Readonly<State>, snapshot?: any) {
        console.log("called");
        this.saveQueries();
    }

    componentWillUnmount() {
        this.subscriptions.forEach((s$) => s$.unsubscribe());
    }

    refreshColumn = (index: number) => {
        const { query } = this.state.columns[index];
        this.saveQueries();
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

    setSolutions = (solutions: SolutionMap, index: number) => {
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

    saveQueries = () => {
        const queries = this.state.columns.map((c) => c.query);
        window.localStorage.setItem(SOLVERS_KEY, JSON.stringify(queries));
    }

    addColumn = () => {
        this.setState((prevState) => {
            const column = this.newColumn('', prevState.columns.length, false);
            return {
                ...prevState,
                columns: prevState.columns.concat([column]),
            }
        }, () => {
            const i = this.subjects.length;
            const s$ = new Subject<string>();
            this.subjects.push(s$);
            this.subscriptions.push(this.getSubscription(s$, i))
        });
    };

    removeColumn = (index: number) => {
        console.log('closed');
        this.subjects.forEach((s) => s.complete());
        this.subscriptions.forEach((s) => s.unsubscribe());
        this.setState((prevState) => {
            const columns = prevState.columns.concat();
            columns.splice(index, 1);
            const newColumns = columns.map((c, i) => {
                return this.newColumn(c.query, i, false, c.solutions);
            });
            return {
                ...prevState,
                columns: newColumns,
            }
        }, () => {
            const columns = this.state.columns;
            this.subjects = columns.map(() => new Subject());
            this.subscriptions = columns.map((c, i) => this.getSubscription(this.subjects[i], i, undefined, c.solutions));
        });
    };

    render() {
        const { columns, start, end } = this.state;
        return (
            <React.Fragment>
                <Button onClick={this.addColumn}>Add Column</Button>
                <CompareBoard columns={columns} start={start} end={end} />
            </React.Fragment>
        );
    }
}

export default withMessageContext(CompareBoardWrapper);
