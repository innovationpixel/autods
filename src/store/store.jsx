import { applyMiddleware, combineReducers, compose, createStore } from 'redux';
import PostsReducer from './reducers/PostsReducer';
import { thunk } from 'redux-thunk';
import { AuthReducer } from './reducers/AuthReducer';
import { EbayReducer } from './reducers/EbayReducer';
import { AliExpressReducer } from './reducers/AliExpressReducer';
import todoReducers from './reducers/Reducers';

const middleware = applyMiddleware(thunk);

const composeEnhancers =
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const reducers = combineReducers({
    posts: PostsReducer,
    auth: AuthReducer,
    ebay: EbayReducer,
    aliexpress: AliExpressReducer,
    todoReducers,
});

export const store = createStore(reducers, composeEnhancers(middleware));
