import React,{useEffect,useState} from 'react';

import Modal, {closeStyle} from 'simple-react-modal'
 
export default class ModalComponent extends React.PureComponent{
 
  constructor(props){
    super(props)
    this.state = {
      show: true
    }
  }
 
  show(){
    this.setState({show: true})
  }
 
  close(){
    this.setState({show: false})
  }
 
  componentDidUpdate(prevProps) {
    if(this.props.data !== prevProps.data  || this.props.isModal !== prevProps.isModal){
      return true
    }
  }

  render(){
    const CONTRACT_ADDRESS = "0x4e4d59d45BA9611F8E9BB2AC963cb6af78e6418E"
    const OPENSEA_CONTRACT = "https://testnets.opensea.io/assets/mumbai/" + CONTRACT_ADDRESS ;
    return (
      <div>
        <Modal
          className="modal-class"
          containerClassName="test"
          closeOnOuterClick={true}
          show={this.props.isModal}
          onClose={()=>this.props.isModalFn(!this.props.isModal)}
          >
            <a style={closeStyle} onClick={()=>this.props.isModalFn(!this.props.isModal)}>X</a>
            {/* <div><a href={ OPENSEA_CONTRACT + "/" + this.props.data.tokenId }  target="_blank" rel="noopener noreferrer">Your Domain <i>{this.props.data.domainMinted}.shadian</i> minted Opensea 💜</a></div> */}
            <div><a  target="_blank" rel="noopener noreferrer">Your Domain <i>{this.props.data.domainMinted}.shm</i> minted 💜</a></div>
        </Modal>
      </div>
    )
  }
}