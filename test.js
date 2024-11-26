const rule = require("./index").rules["no-ssr-browser-globals"];
const RuleTester = require("eslint").RuleTester;

const getReportMessage = (name) =>
  `'${name}' is not allowed in a server-side context. Wrap it in a client-side safe context, such as useEffect or an event handler, or mark it with @client annotation.
---------------------------
// @client
const value = location.host;
-----------
`;
const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

const invalidCodes = [
  [`const host = location.host;`, getReportMessage("location")],
  [
    `
      const func = () => {
        const location = 'localhost';
      }

      const host = location.host;
    `,
    getReportMessage("location"),
  ],
  [
    `const App = () => {
      return <button onclick={() => {const value = location.host;}} />;
    }`,
    getReportMessage("location"),
  ],
  [
    `
      // @client
      const otherCode = 'bar';

      const host = location.host;
    `,
    getReportMessage("location"),
  ],
];

const validCodes = [
  // Just specify a normal variable
  [
    `
    const foo = 'bar';

    const value = 'localhost';

    const location = {
      host: 'hostValue',
    }

    const host = location.host;
    `,
  ],
  // Specify a normal object but its key has the same name as a browser global
  [
    `
      const obj = { location: 'localhost' };
      const host = obj.location;
    `,
  ],
  // Use browser globals in react event handler
  [
    `
      const App = () => {
        return <button onClick={() => {const value = location.host;}} />;
      }
    `,
  ],

  // Mark client-side code with @client annotation
  [
    `
      // @client
      const host = location.host;

      /* @client */
      const href = location.href;
    `,
  ],

  // In window !== undefined check
  [
    `
      if (window !== undefined) {
        const host = location.host;
      }
    `,
    {
      conditionCheck: true,
    },
  ],

  // allowedGlobals
  [
    `
      const host = location.host;

      const value = location.href;
    `,
    {
      allowedGlobals: ["location"],
    },
  ],

  // allowedHooks
  [
    `useEffect(() => {
      const value = location.host;
    }, []);`,
    {
      allowedHooks: ["useEffect"],
    },
  ],

  // allowedFunctions
  [
    `
    const specialFunction = (fn) => {
      return fn();
    }

    specialFunction(() => {
      const value = location.host;
    });
    `,
    {
      allowedFunctions: ["specialFunction"],
    },
  ],
];

ruleTester.run("no-unsafe-client-side", rule, {
  valid: validCodes.map((code) => ({
    code: code[0],
    filename: "test.jsx",
    options: code[1] ? [code[1]] : [],
  })),
  invalid: invalidCodes.map((code) => ({
    code: code[0],
    errors: [{ message: code[1] }],
    filename: "test.jsx",
  })),
});
