import 'dotenv/config';
import {
  RunnablePassthrough,
  RunnableLambda,
  RunnableSequence,
  RunnableMap,
} from '@langchain/core/runnables';

// const chain = RunnableSequence.from([
//   RunnableLambda.from((input) => ({ concept: input })),
//   RunnableMap.from({
//     original: new RunnablePassthrough(),
//     processed_: RunnableLambda.from((obj) => {
//       console.log(obj);
//       return {
//         concept: input,
//         upper: obj.concept.toUpperCase(),
//         length: obj.concept.length,
//       };
//     }),
//   }),
// ]);
/* const chain = RunnableSequence.from([
    (input) => ({ concept: input }),
    RunnablePassthrough.assign({
        original: new RunnablePassthrough(),
        processed: (obj) => ({
            concept: input,
            upper: obj.concept.toUpperCase(),
            length: obj.concept.length,
        })
    })
]); */

const chain = RunnableSequence.from([
  (input) => ({ concept: input }),
  RunnablePassthrough.assign({
    upper: (obj) => obj.concept.toUpperCase(),
    length: (obj) => obj.concept.length,
  }),
]);

const runnableAssign = RunnablePassthrough.assign({
  input: (obj) => obj,
}).pipe(
  RunnablePassthrough.assign({
    upper: (obj) => obj.input.toUpperCase(),
    length: (obj) => obj.input.length,
  }),
);

const input = 'Hello LangChain';
const result = await chain.invoke(input);
console.log(result);
