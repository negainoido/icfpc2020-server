import React, {useCallback, useContext, useEffect, useState} from 'react';
import Solutions, {Solution} from './Solutions';
import MessageContext from '../contexts/MessageContext';
import {fetchSolutions} from '../api';
import Pager from '../components/Pager';

interface State {
    solutions: Solution[];
    page: number;
    loading: boolean;
}

const SolutionWrapper = () => {
        const [state, setState] = useState<State>({
            solutions: [],
            page: 1,
            loading: false
        });
        const { sendMessage } = useContext(MessageContext);
        const updateSolutions = useCallback((page: number) => {
            fetchSolutions(page).then((solutions) => {
                setState((prevState) => ({
                    ...prevState,
                    solutions,
                    loading: false,
                }));
            }).catch((e) => {
                setState((prevState) => ({ ...prevState, loading: false }));
                sendMessage('error', 'Failed to load solutions');
            });
        }, [sendMessage]);

        useEffect(() => {
            setState((prevState) => ({ ...prevState, loading: true }));
            updateSolutions(state.page);
        }, [state.page, updateSolutions]);

        const handleClick = (page: number) => {
            setState((prevState) => ({ ...prevState, page }));
        };

        return (
            <React.Fragment>
                <Solutions solutions={state.solutions}/>
                <Pager page={state.page} min={1} max={8} range={5} onClick={handleClick} />
            </React.Fragment>
        );
};
export default SolutionWrapper;