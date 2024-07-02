
// define type to save parentMessageId and conversationId
export interface Ids {
    parentMessageId?: string
    conversationId?: string
  }

export interface Bot {
    chat(message:string, ids:Ids) : Promise<[string, Ids]>; 
}


