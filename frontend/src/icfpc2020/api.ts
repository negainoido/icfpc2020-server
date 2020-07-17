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

export const fetchSolutionsBySolver = (solver: string, page: number = 1) => {
    const url = new URL("/v1/icfpc2019/solutions", process.env.REACT_APP_API_URL);
    url.searchParams.append("solver", solver);
    url.searchParams.append("page", page.toString());
    return fetch(url.href)
        .then((response) => {
            if (response.status >= 400) {
                return Promise.reject(`status ${response.status}`);
            }
            return response.json() as Promise<Solution[]>
        });
}
