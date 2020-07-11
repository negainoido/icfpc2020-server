import {Problem} from './problems/Problems';
import {Solution} from './solutions/Solutions';

export const fecthProblems = (page: number) => {
    return fetch(process.env.REACT_APP_API_URL + "v1/icfpc2019/problems?page=" + page)
        .then((response) => response.json() as Promise<Problem[]>);
};

export const fetchSolutions = (page: number) => {
    return fetch(process.env.REACT_APP_API_URL + "v1/icfpc2019/solutions?page=" + page)
        .then((response) => response.json() as Promise<Solution[]>);
}