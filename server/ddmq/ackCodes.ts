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
  NO_SUCH_METHOD:   0,
  METHOD_EXCEPTION: 1
};

/*****************************
 * $connack CODES
 *****************************/
 export const CONNACK = {
   OK:                0,
   WRONG_PASSWORD:    1,
   NO_SUCH_USER:      2
 };
