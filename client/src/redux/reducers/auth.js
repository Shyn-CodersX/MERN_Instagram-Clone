import {
  LOADING,
  REGISTER_SUCCESS,
  REGISTER_FAIL,
  CONFIRMATION_SUCCESS,
  CONFIRMATION_FAIL,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  SENDMAIL_SUCCESS,
  SENDMAIL_FAIL,
  USER_LOADED,
  AUTH_ERROR,
} from '../types';

const initialState = {
  token: localStorage.getItem('token'),
  isAuthenticated: null,
  loading: false,
  user: null,
  error: null,
  isSendEmail: false,
};

export default function (state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case USER_LOADED:
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: payload,
      };
    case REGISTER_SUCCESS:
    case CONFIRMATION_SUCCESS:
    case LOGIN_SUCCESS:
      localStorage.setItem('token', payload.token);
      return {
        ...state,
        token: payload.token,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    case REGISTER_FAIL:
    case CONFIRMATION_FAIL:
    case LOGIN_FAIL:
    case AUTH_ERROR:
      localStorage.removeItem('token');
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null,
        error: payload,
      };
    case SENDMAIL_SUCCESS:
      return {
        ...state,
        isSendEmail: true,
        loading: false,
      };
    case SENDMAIL_FAIL:
      return {
        ...state,
        isSendEmail: false,
        loading: false,
      };
    case LOADING:
      return {
        ...state,
        loading: true,
      };
    default:
      return state;
  }
}
