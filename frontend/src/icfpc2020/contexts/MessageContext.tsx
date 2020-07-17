import React from 'react';
import {MessageType} from '../components/MessageSnack';

export interface MessageContextProps {
    sendMessage: (type: MessageType, text: string) => void;
}

const MessageContext = React.createContext<MessageContextProps>({ sendMessage: () => {}});

export const withMessageContext = <P,>(RC: React.ComponentType<P>) => {
    return (props: P) => {
        return (
            <MessageContext.Consumer>
                {(context) => <RC {...props} {...context}/>}
            </MessageContext.Consumer>
        );
    };
};

export default MessageContext;
