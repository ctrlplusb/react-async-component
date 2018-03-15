import * as React from 'react';

/**
 * The configuration for an asynchronous component.
 */
export interface Configuration<P> {
	resolve: () => Promise<React.ComponentType<P> | {default: React.ComponentType<P>}>;
	LoadingComponent?: (props: P) => JSX.Element;
	ErrorComponent?: (props: P & { error: Error }) => JSX.Element;
	name?: string;
	autoResolveES2015Default?: boolean;
	env?: 'node' | 'browser';
	serverMode?: 'resolve' | 'defer' | 'boundary';
}

/**
 * A wrapper to provide the asynchronous component resolving in a React tree.
 */
export class AsyncComponentProvider extends React.Component<ProviderProps> {}

/**
 * The properties that the {@link AsyncComponentProvider} accepts.
 */
export interface ProviderProps {
	children: JSX.Element[] | JSX.Element;
	asyncContext?: Context;
	rehydrateState?: object;
}

/**
 * This interface defines the asynchronous context uses for the asynchronous resolving
 * of components.
 */
export interface Context {
	getState: () => object;
}

/**
 * Convert the given component to a an asynchronous component.
 *
 * @param config The configuration to use for the asynchronous component.
 */
export function asyncComponent<P>(config: Configuration<P>): React.ComponentType<P>;

/**
 * Create a context for the asynchronous component resolving module.
 */
export function createAsyncContext(): Context;
