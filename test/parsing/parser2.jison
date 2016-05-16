/* description: Parses GraphQL IDL w/ extensions */

/* lexical grammar */
%lex
%%

schema                return 'SCHEMA'
scalar                return 'SCALAR'
type                  return 'TYPE'
interface             return 'INTERFACE'
union                 return 'UNION'
enum                  return 'ENUM'
input                 return 'INPUT'
implements            return 'IMPLEMENTS'
"{"                   return 'OPEN'
"}"                   return 'CLOSE'
"("                   return 'OPENP'
")"                   return 'CLOSEP'
","                   return 'COMMA'
"!"                   return 'BANG'
":"                   return 'COLON'
"="                   return 'EQUALS'
"|"                   return 'PIPE'
[a-zA-Z][a-zA-Z0-9]*  return 'IDENTIFIER'
<<EOF>>               return 'EOF'
\n                    return 'NEWLINE'
[ \t]+                /* ignore horizontal whitespace */

/lex

%start start

%% /* language grammar */

start: definitions EOF;

definitions: definitions NEWLINE s definition | definition;
definition: schemaDefinition | scalarTypeDefinition | objectTypeDefinition |
  interfaceTypeDefinition | unionTypeDefinition | enumTypeDefinition |
  inputObjectTypeDefinition;

schemaDefinition: SCHEMA s OPEN s operationDefinitions s CLOSE;
operationDefinitions: operationDefinition | operationDefinitions s operationDefinition;
operationDefinition: IDENTIFIER COLON IDENTIFIER optionalComma;

scalarTypeDefinition: SCALAR IDENTIFIER;

objectTypeDefinition: TYPE s IDENTIFIER s optionalInterfaceImplementations OPEN s fieldDefinitions s CLOSE;
optionalInterfaceImplementations: | IMPLEMENTS s interfaceImplementations s;
interfaceImplementations: interfaceImplementation | interfaceImplementations s interfaceImplementation;
interfaceImplementation: IDENTIFIER optionalComma;
fieldDefinitions: fieldDefinition | fieldDefinitions s fieldDefinition;
fieldDefinition: IDENTIFIER s optionalArgumentsDefinition COLON s IDENTIFIER optionalBang optionalComma;
optionalArgumentsDefinition: | OPENP s argumentsDefinition s CLOSEP s;
argumentsDefinition: argumentDefinition | argumentsDefinition s argumentDefinition;
argumentDefinition: IDENTIFIER s COLON s IDENTIFIER optionalBang optionalComma;

interfaceTypeDefinition: INTERFACE s IDENTIFIER s OPEN s fieldDefinitions s CLOSE;

enumTypeDefinition: ENUM s IDENTIFIER s OPEN s enumValues s CLOSE;
enumValues: enumValue | enumValues s enumValue;
enumValue: IDENTIFIER optionalComma;

inputObjectTypeDefinition: INPUT s IDENTIFIER s OPEN s inputValueDefinitions s CLOSE;
inputValueDefinitions: inputValueDefinition | inputValueDefinitions s inputValueDefinition;
inputValueDefinition: IDENTIFIER s COLON s IDENTIFIER optionalBang optionalComma;

unionTypeDefinition: UNION s IDENTIFIER s EQUALS s unionMembers;
unionMembers: unionMember | unionMember PIPE s unionMembers;
unionMember: IDENTIFIER;

optionalBang: | BANG;
optionalComma: | COMMA;
s: | nls;
nls: NEWLINE | nls NEWLINE;
