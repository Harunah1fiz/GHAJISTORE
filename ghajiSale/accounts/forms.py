from django import forms
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

User = get_user_model()

class ProfileUpdateForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email']


class StaffCreateForm(forms.Form):
    username = forms.CharField(max_length=150)
    first_name = forms.CharField(max_length=150, required=False)
    last_name = forms.CharField(max_length=150, required=False)
    email = forms.EmailField(required=False)
    role = forms.ChoiceField()
    is_superuser = forms.BooleanField(required=False)
    password1 = forms.CharField(widget=forms.PasswordInput)
    password2 = forms.CharField(widget=forms.PasswordInput)

    def __init__(self, *args, roles, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['role'].choices = [(role, role) for role in roles]

    def clean_username(self):
        username = self.cleaned_data['username'].strip()
        if User.objects.filter(username__iexact=username).exists():
            raise ValidationError('A user with this username already exists.')
        return username

    def clean(self):
        cleaned = super().clean()
        password1 = cleaned.get('password1')
        password2 = cleaned.get('password2')
        if password1 and password2 and password1 != password2:
            self.add_error('password2', 'The passwords do not match.')
        if password1:
            candidate = User(
                username=cleaned.get('username', ''),
                first_name=cleaned.get('first_name', ''),
                last_name=cleaned.get('last_name', ''),
                email=cleaned.get('email', ''),
            )
            try:
                validate_password(password1, candidate)
            except ValidationError as error:
                self.add_error('password1', error)
        return cleaned


class StaffUpdateForm(forms.Form):
    role = forms.ChoiceField()
    is_active = forms.BooleanField(required=False)
    first_name = forms.CharField(max_length=150, required=False)
    last_name = forms.CharField(max_length=150, required=False)
    email = forms.EmailField(required=False)

    def __init__(self, *args, roles, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['role'].choices = [(role, role) for role in roles]