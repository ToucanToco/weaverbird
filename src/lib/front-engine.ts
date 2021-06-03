// @ts-ignore
import DataFrame from "dataframe-js";
import {Pipeline} from "@/lib/steps";


export function execute_pipeline(pipeline: Pipeline, data: Array<{string:any}>) {
  const df = new DataFrame(data, Object.keys(data[0]))
  const filteredDf = df.filter(row => row.get('Price') > 1200)

  return filteredDf.toArray();
}
