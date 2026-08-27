import { useEffect, useRef } from 'react';
import { DependencyList } from 'react';

interface FetchFunction {
    (): Promise<void>;
}

const useFetchOnce = (fetchFunction: FetchFunction, dependencies: DependencyList = []): void => {
    const hasFetched = useRef<boolean>(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                await fetchFunction();
            } catch (err) {
                console.error('Fetch error:', err);
            }
        };

        if (!hasFetched.current) {
            fetchData();
            hasFetched.current = true;
        }
    }, [fetchFunction, dependencies]);
};

export default useFetchOnce;
