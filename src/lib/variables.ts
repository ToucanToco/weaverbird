interface AvailableVariable {
  identifier: string; // how the variable will be written in the code
  value: any; // current value of the variable
  category?: string;
  label: string;
}

export type VariablesBucket = AvailableVariable[];

export interface VariablesCategory {
  label: string | undefined;
  variables: AvailableVariable[];
}

export interface VariableDelimiters {
  start: string;
  end: string;
}
