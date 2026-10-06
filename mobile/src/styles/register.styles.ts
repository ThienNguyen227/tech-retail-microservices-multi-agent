import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 40,
  },

  header: {
    alignItems: 'center',
    marginBottom: 30,
  },

  logo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#168b87',
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    color: '#777777',
    textAlign: 'center',
  },

  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },

  progressStep: {
    alignItems: 'center',
  },

  progressCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#eeeeee',
    justifyContent: 'center',
    alignItems: 'center',
  },

  activeCircle: {
    backgroundColor: '#168b87',
  },

  circleText: {
    color: '#777777',
    fontSize: 14,
    fontWeight: '600',
  },

  activeCircleText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },

  activeStepText: {
    marginTop: 6,
    fontSize: 12,
    color: '#168b87',
    fontWeight: '600',
  },

  stepText: {
    marginTop: 6,
    fontSize: 12,
    color: '#999999',
  },

  progressLine: {
    width: 70,
    height: 2,
    backgroundColor: '#dddddd',
    marginHorizontal: 10,
    marginBottom: 20,
  },

  form: {
    width: '100%',
  },

  inputGroup: {
    marginBottom: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#222222',
    backgroundColor: '#ffffff',
  },

  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 2,
    marginBottom: 24,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: '#cccccc',
    borderRadius: 5,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  checkboxActive: {
    backgroundColor: '#168b87',
    borderColor: '#168b87',
  },

  checkmark: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },

  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: '#666666',
  },

  termsLink: {
    color: '#168b87',
    fontWeight: '600',
  },

  registerButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: '#168b87',
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonPressed: {
    opacity: 0.8,
  },

  registerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },

  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
  },

  loginText: {
    fontSize: 14,
    color: '#777777',
  },

  loginLink: {
    fontSize: 14,
    color: '#168b87',
    fontWeight: '700',
  },
});