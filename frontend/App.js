
import React, { useState } from 'react';
import {
  View, Text, TextInput, Button, FlatList,
  ActivityIndicator, Alert, StyleSheet, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl;

export default function App() {
  const [pantalla, setPantalla] = useState('login');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rolRegistro, setRolRegistro] = useState('cliente');
  const [rol, setRol] = useState('');
  const [token, setToken] = useState('');
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(false);

  const [nombreServicio, setNombreServicio] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [duracion, setDuracion] = useState('30');
  const [precio, setPrecio] = useState('');

  async function registrar() {
    if (!nombre.trim() || !email.trim() || !password) {
      Alert.alert('Atención', 'Completa todos los campos');
      return;
    }

    setCargando(true);
    try {
      const respuesta = await fetch(`${API_URL}/auth/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim(),
          password,
          rol: rolRegistro
        })
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || 'No se pudo registrar');
      }

      Alert.alert('Correcto', 'Cuenta creada. Ahora puedes iniciar sesión.');
      setEmail(email.trim());
      setPassword('');
      setNombre('');
      setPantalla('login');
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo conectar con la API');
    } finally {
      setCargando(false);
    }
  }

  async function iniciarSesion() {
    if (!email.trim() || !password) {
      Alert.alert('Atención', 'Completa el correo y la contraseña');
      return;
    }

    setCargando(true);
    try {
      const respuesta = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || 'No se pudo iniciar sesión');
      }

      await AsyncStorage.setItem('token', datos.token);
      setToken(datos.token);
      setRol(datos.usuario.rol);
      await cargarServicios(datos.token);
      setPantalla('servicios');
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo conectar con la API');
    } finally {
      setCargando(false);
    }
  }

  async function cargarServicios(jwt = token) {
    const respuesta = await fetch(`${API_URL}/servicios`, {
      headers: { Authorization: `Bearer ${jwt}` }
    });

    const datos = await respuesta.json();

    if (respuesta.status === 401) {
      await AsyncStorage.removeItem('token');
      setToken('');
      setRol('');
      setPantalla('login');
      throw new Error('La sesión venció. Inicia sesión otra vez.');
    }

    if (!respuesta.ok) {
      throw new Error(datos.error || 'No se pudieron consultar los servicios');
    }

    setServicios(datos);
  }

  async function crearServicio() {
    if (!nombreServicio.trim() || !descripcion.trim() ||
        !duracion.trim() || !precio.trim()) {
      Alert.alert('Atención', 'Completa todos los campos del servicio');
      return;
    }

    setCargando(true);
    try {
      const respuesta = await fetch(`${API_URL}/servicios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: nombreServicio.trim(),
          descripcion: descripcion.trim(),
          duracion: Number(duracion),
          precio: Number(precio)
        })
      });

      const datos = await respuesta.json();

      if (respuesta.status === 401) {
        await AsyncStorage.removeItem('token');
        setToken('');
        setRol('');
        setPantalla('login');
        throw new Error('La sesión venció. Inicia sesión otra vez.');
      }

      if (!respuesta.ok) {
        throw new Error(datos.error || 'No se pudo crear el servicio');
      }

      setNombreServicio('');
      setDescripcion('');
      setDuracion('30');
      setPrecio('');
      await cargarServicios();
      setPantalla('servicios');
      Alert.alert('Correcto', 'Servicio creado correctamente');
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo conectar con la API');
    } finally {
      setCargando(false);
    }
  }

  async function cerrarSesion() {
    await AsyncStorage.removeItem('token');
    setToken('');
    setRol('');
    setPassword('');
    setPantalla('login');
  }

  function campo(placeholder, valor, cambiar, opciones = {}) {
    return (
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={valor}
        onChangeText={cambiar}
        {...opciones}
      />
    );
  }

  if (pantalla === 'login') {
    return (
      <ScrollView contentContainerStyle={styles.contenedor}>
        <Text style={styles.titulo}>Sistema de Reservas</Text>
        {campo('Correo electrónico', email, setEmail, {
          keyboardType: 'email-address',
          autoCapitalize: 'none'
        })}
        {campo('Contraseña', password, setPassword, {
          secureTextEntry: true
        })}

        {cargando ? <ActivityIndicator size="large" /> :
          <Button title="Iniciar sesión" onPress={iniciarSesion} />}

        <View style={styles.separacion} />
        <Button
          title="Crear cuenta"
          onPress={() => setPantalla('registro')}
        />
      </ScrollView>
    );
  }

  if (pantalla === 'registro') {
    return (
      <ScrollView contentContainerStyle={styles.contenedor}>
        <Text style={styles.titulo}>Crear cuenta</Text>
        {campo('Nombre completo', nombre, setNombre)}
        {campo('Correo electrónico', email, setEmail, {
          keyboardType: 'email-address',
          autoCapitalize: 'none'
        })}
        {campo('Contraseña', password, setPassword, {
          secureTextEntry: true
        })}

        <Text style={styles.etiqueta}>Tipo de cuenta</Text>
        <View style={styles.separacion}>
          <Button
            title="Cliente"
            onPress={() => setRolRegistro('cliente')}
            color={rolRegistro === 'cliente' ? '#1769aa' : '#888'}
          />
        </View>
        <View style={styles.separacion}>
          <Button
            title="Administrador"
            onPress={() => setRolRegistro('admin')}
            color={rolRegistro === 'admin' ? '#1769aa' : '#888'}
          />
        </View>

        <View style={styles.separacion}>
          {cargando ? <ActivityIndicator size="large" /> :
            <Button title="Registrarme" onPress={registrar} />}
        </View>
        <Button
          title="Volver al inicio de sesión"
          onPress={() => setPantalla('login')}
        />
      </ScrollView>
    );
  }

  if (pantalla === 'crearServicio') {
    return (
      <ScrollView contentContainerStyle={styles.contenedor}>
        <Text style={styles.titulo}>Crear servicio</Text>
        {campo('Nombre del servicio', nombreServicio, setNombreServicio)}
        {campo('Descripción', descripcion, setDescripcion)}
        {campo('Duración en minutos', duracion, setDuracion, {
          keyboardType: 'numeric'
        })}
        {campo('Precio en RD$', precio, setPrecio, {
          keyboardType: 'decimal-pad'
        })}

        {cargando ? <ActivityIndicator size="large" /> :
          <Button title="Guardar servicio" onPress={crearServicio} />}
        <View style={styles.separacion} />
        <Button
          title="Volver a servicios"
          onPress={() => setPantalla('servicios')}
        />
      </ScrollView>
    );
  }

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Servicios disponibles</Text>
      <Text style={styles.etiqueta}>
        Sesión: {rol === 'admin' ? 'Administrador' : 'Cliente'}
      </Text>

      <View style={styles.separacion}>
        <Button
          title="Actualizar servicios"
          onPress={() => cargarServicios().catch(error =>
            Alert.alert('Error', error.message)
          )}
        />
      </View>

      {rol === 'admin' && (
        <View style={styles.separacion}>
          <Button
            title="Crear servicio"
            onPress={() => setPantalla('crearServicio')}
          />
        </View>
      )}

      <FlatList
        style={styles.lista}
        data={servicios}
        keyExtractor={item => String(item.id)}
        ListEmptyComponent={
          <Text>No hay servicios registrados.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.servicio}>
            <Text style={styles.nombre}>{item.nombre}</Text>
            <Text>{item.descripcion}</Text>
            <Text>Duración: {item.duracion} minutos</Text>
            <Text>Precio: RD$ {item.precio}</Text>
          </View>
        )}
      />
      <Button title="Cerrar sesión" onPress={cerrarSesion} />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#fff'
  },
  titulo: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14
  },
  servicio: {
    padding: 14,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8
  },
  nombre: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  etiqueta: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center'
  },
  separacion: {
    marginVertical: 8
  },
  lista: {
    flex: 1
  }
});
