// /**
//  * Sample React Native App
//  * https://github.com/facebook/react-native
//  * @flow
//  */

// import React, { Component } from 'react';
// import {
//   Platform,
//   StyleSheet,
//   Text,
//   View
// } from 'react-native';

// const instructions = Platform.select({
//   ios: 'Press Cmd+R to reload,\n' +
//     'Cmd+D or shake for dev menu',
//   android: 'Double tap R on your keyboard to reload,\n' +
//     'Shake or press menu button for dev menu',
// });

// type Props = {};
// export default class App extends Component<Props> {
//   render() {
//     return (
//       <View style={styles.container}>
//         <Text style={styles.welcome}>
//           These are where the butts go!
//         </Text>
//         <Text style={styles.instructions}>
//           To get started, edit App.js
//         </Text>
//         <Text style={styles.instructions}>
//           {instructions}
//         </Text>
//       </View>
//     );
//   }
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#F5FCFF',
//   },
//   welcome: {
//     fontSize: 20,
//     textAlign: 'center',
//     margin: 10,
//   },
//   instructions: {
//     textAlign: 'center',
//     color: '#333333',
//     marginBottom: 5,
//   },
// });


import React, { Component } from 'react';
import {stringToBytes} from 'convert-string'
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  NativeAppEventEmitter,
  NativeEventEmitter,
  NativeModules,
  Platform,
  PermissionsAndroid,
  ListView,
  ScrollView,
  AppState,
  Dimensions,
} from 'react-native';
import BleManager from 'react-native-ble-manager';
import {
  StackNavigator,
} from 'react-navigation';

const window = Dimensions.get('window');
const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

var myData = stringToBytes("this is my data");

export default class App extends Component {
  constructor( Props){
    super()



    this.state = {
      scanning:false,
      peripherals: new Map(),
      appState: '',
      BIG20_CONNECTTED:false,
      BLE_CONNECT_SCREEN: false
    }

    this.handleDiscoverPeripheral = this.handleDiscoverPeripheral.bind(this);
    this.handleStopScan = this.handleStopScan.bind(this);
    this.handleUpdateValueForCharacteristic = this.handleUpdateValueForCharacteristic.bind(this);
    this.handleDisconnectedPeripheral = this.handleDisconnectedPeripheral.bind(this);
    this.handleAppStateChange = this.handleAppStateChange.bind(this);
    this.BLE_CONNECT_BUTTON = this.BLE_CONNECT_BUTTON.bind(this);
  }

  componentDidMount() {

    AppState.addEventListener('change', this.handleAppStateChange);

    BleManager.start({showAlert: false});

    // setInterval(() => {
    //   this.connectBIG20();
    // }, 2000);

    this.handlerDiscover = bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', this.handleDiscoverPeripheral );
    this.handlerStop = bleManagerEmitter.addListener('BleManagerStopScan', this.handleStopScan );
    this.handlerDisconnect = bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', this.handleDisconnectedPeripheral );
    this.handlerUpdate = bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', this.handleUpdateValueForCharacteristic );


    if (Platform.OS === 'android' && Platform.Version >= 23) {
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((result) => {
            if (result) {
              console.log("Permission is OK");
            } else {
              PermissionsAndroid.requestPermission(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((result) => {
                if (result) {
                  console.log("User accept");
                } else {
                  console.log("User refuse");
                }
              });
            }
      });
    }

  }

  handleAppStateChange(nextAppState) {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      console.log('App has come to the foreground!')
      BleManager.getConnectedPeripherals([]).then((peripheralsArray) => {
        console.log('Connected peripherals: ' + peripheralsArray.length);
      });
    }
    this.setState({appState: nextAppState});
  }

  componentWillUnmount() {
    this.handlerDiscover.remove();
    this.handlerStop.remove();
    this.handlerDisconnect.remove();
    this.handlerUpdate.remove();
  }

  handleDisconnectedPeripheral(data) {
    let peripherals = this.state.peripherals;
    let peripheral = peripherals.get(data.peripheral);
    if (peripheral) {
      peripheral.connected = false;
      peripherals.set(peripheral.id, peripheral);
      this.setState({peripherals});
    }
    console.log('Disconnected from ' + data.peripheral);
  }

  handleUpdateValueForCharacteristic(data) {
    console.log('Received data from ' + data.peripheral + ' characteristic ' + data.characteristic, data.value);
  }

  handleStopScan() {
    console.log('Scan is stopped');
    this.setState({ scanning: false });
  }

  startScan() {
    if (!this.state.scanning) {
      this.setState({peripherals: new Map()});
      BleManager.scan([], 3, true).then((results) => {
        console.log('Scanning...');
        this.setState({scanning:true});
      });
    }
  }

  retrieveConnected(){
    BleManager.getConnectedPeripherals([]).then((results) => {
      console.log(results);
      var peripherals = this.state.peripherals;
      for (var i = 0; i < results.length; i++) {
        var peripheral = results[i];
        peripheral.connected = true;
        peripherals.set(peripheral.id, peripheral);
        this.setState({ peripherals });
      }
    });
  }

  handleDiscoverPeripheral(peripheral){
    var peripherals = this.state.peripherals;
    if (!peripherals.has(peripheral.id)){
      console.log('Got ble peripheral', peripheral);
      peripherals.set(peripheral.id, peripheral);
      this.setState({ peripherals })
    }
  }

  // connectBIG20(){
  //   BleManager.getConnectedPeripherals([]).then((results) => {
  //     for (var i = 0; i < results.length; i++) {
  //       if(results[i].name == "BIG20"){
  //         console.log("connected to big20");
  //         this.setState({BIG20_CONNECTTED:true});
  //       }else{
  //         console.log("not connected");
  //         this.setState({BIG20_CONNECTTED:false});
  //       }
  //     }
  //     if(results.length == 0){
  //       this.setState({BIG20_CONNECTTED:false});
  //       console.log("not connected")
  //     }

  //     if(this.state.BIG20_CONNECTTED == false){
  //       BleManager.scan([], 3, true).then((results) => {
  //         console.log('Scanning...');
  //         this.setState({scanning:true});
  //       });
  //     }


  //   });
  //   // const list = Array.from(this.state.peripherals.values());
  //   // for (var a = 0; a < list.length; a++){
  //   //   if(list[a].name && list[a].name == "BIG20"){
  //   //     //do nothing
  //   //     console.log("chugging");
  //   //   }else{
  //   //     this.startScan();
  //   //   }
  //   // }

  // }

  BLE_CONNECT_BUTTON(){
    this.startScan();
    const { BLE_CONNECT_SCREEN } = this.state;
    this.setState({ BLE_CONNECT_SCREEN : !BLE_CONNECT_SCREEN});
    console.log(this.state.BLE_CONNECT_SCREEN);
  }

  writeBIG20(){
    const list = Array.from(this.state.peripherals.values());
    var BIG20_ID;
    for (var a = 0; a < list.length; a++){
      if(list[a].name && list[a].name == "BIG20"){
        BIG20_ID = list[a].id;
      }
    }   

    var SERVICE_UUID = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';
    var CHARACTERISTIC_UUID_RX = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E';
    var CHARACTERISTIC_UUID_TX = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E';

    //BleManager.getConnectedPeripherals([]).then((results) => {

      //need to make a function that retreives MAC address from big 20 instead of this clunky reaults[0].id
      BleManager.retrieveServices(BIG20_ID).then((peripheralInfo) => {
        // Success code
        //console.log('Peripheral info:', peripheralInfo);

        BleManager.writeWithoutResponse(BIG20_ID, SERVICE_UUID, CHARACTERISTIC_UUID_RX, myData).then(() => {
          // Success code
          console.log('Writed: ' + myData);
        })
        .catch((error) => {
          // Failure code
          console.log("write error: " + error);
        });
      }).catch((error) =>{
          console.log("serices error: "  + error);
      });
    //});  
  }


  test(peripheral) {
    if (peripheral){
      if (peripheral.connected){
        BleManager.disconnect(peripheral.id);
      }else{
        BleManager.connect(peripheral.id).then(() => {
          let peripherals = this.state.peripherals;
          let p = peripherals.get(peripheral.id);
          if (p) {
            p.connected = true;
            peripherals.set(peripheral.id, p);
            this.setState({peripherals});
          }
          console.log('Connected to ' + peripheral.id);
          this.retrieveConnected()
        }).catch((error) => {
          console.log('Connection error', error);
        });
      }
    }
  }

  render() {
    const list = Array.from(this.state.peripherals.values());
    const dataSource = ds.cloneWithRows(list);


    return (
      <View style={styles.container}>
        <TouchableHighlight style={{marginTop: 40,margin: 20, padding:20, backgroundColor:'#ccc'}} onPress={() => this.startScan() }>
          <Text>Scan Bluetooth ({this.state.scanning ? 'on' : 'off'})</Text>
        </TouchableHighlight>
        <TouchableHighlight style={{marginTop: 0,margin: 20, padding:20, backgroundColor:'#ccc'}} onPress={() => this.writeBIG20() }>
          <Text>Send Data to BIG20</Text>
        </TouchableHighlight>
        <TouchableHighlight style={{marginTop: 0,margin: 20, padding:20, backgroundColor:'#ccc'}} onPress={() => this.BLE_CONNECT_BUTTON() }>
          <Text>Toggle a Box</Text>
        </TouchableHighlight>
        {this.state.BLE_CONNECT_SCREEN && <ShowBLE />}  
        <ScrollView style={styles.scroll}>
          {(list.length == 0) &&
            <View style={{flex:1, margin: 20}}>
              <Text style={{textAlign: 'center'}}>No peripherals</Text>
            </View>
          }
          <ListView
            enableEmptySections={true}
            dataSource={dataSource}
            renderRow={(item) => {
              const color = item.connected ? 'green' : '#fff';
              return (
                <TouchableHighlight onPress={() => this.test(item) }>
                  <View style={[styles.row, {backgroundColor: color}]}>
                    <Text style={{fontSize: 12, textAlign: 'center', color: '#333333', padding: 10}}>{item.name}</Text>
                    <Text style={{fontSize: 8, textAlign: 'center', color: '#333333', padding: 10}}>{item.id}</Text>
                  </View>
                </TouchableHighlight>
              );
            }}
          />
        </ScrollView>
      </View>
    );
  }
}

class ShowBLE extends Component{
  constructor(props){
    super(props)
    app = new App();
  }
  
  render(){
    const list = Array.from(app.state.peripherals.values());
    const dataSource = ds.cloneWithRows(list);
    return(
      <View>
        <ScrollView style={styles.scroll}>
          {(list.length == 0) &&
            <View style={{flex:1, margin: 20}}>
              <Text style={{textAlign: 'center'}}>No peripherals</Text>
            </View>
          }
          <ListView
            enableEmptySections={true}
            dataSource={dataSource}
            renderRow={(item) => {
              const color = item.connected ? 'green' : '#fff';
              return (
                <TouchableHighlight onPress={() => app.test(item) }>
                  <View style={[styles.row, {backgroundColor: color}]}>
                    <Text style={{fontSize: 12, textAlign: 'center', color: '#333333', padding: 10}}>{item.name}</Text>
                    <Text style={{fontSize: 8, textAlign: 'center', color: '#333333', padding: 10}}>{item.id}</Text>
                  </View>
                </TouchableHighlight>
              );
            }}
          />
        </ScrollView>
      </View>
      )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    width: window.width,
    height: window.height
  },
  scroll: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    margin: 10,
  },
  row: {
    margin: 10
  },
});