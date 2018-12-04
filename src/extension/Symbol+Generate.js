Symbol.generate = function * (...names) {
  let i = 0;
  for (;;)
     yield Symbol(names[i++] || i);
};
