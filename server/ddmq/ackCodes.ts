/*****************************
 * $suback CODES
 *****************************/
export const SUBACK = {
  OK:                         0,
  NO_SUCH_PUBLICATION_NAME:   1,
  DUPLICATED_SUBSCRIPTION:    2,
  INTERNAL_SERVER_ERROR:      3
};

/*****************************
 * $callack CODES
 *****************************/
export const CALLACK = {
  OK:                 0,
  NO_SUCH_METHOD:     1,
  METHOD_EXCEPTION:   2,
  SESSION_NOT_FOUND:  3
};

/*****************************
 * $connack CODES
 *****************************/
 export const CONNACK = {
   OK:                0,
   WRONG_PASSWORD:    1,
   NO_SUCH_USER:      2,
   REFUSED:           3
 };

 /*****************************
  * $bindack CODES
  *****************************/
  export const BINDACK = {
    OK: 0
  };
